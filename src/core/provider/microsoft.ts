import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generatePKCE } from "@openauthjs/openauth/pkce";
import { logger } from "@core/logger";
import type {
  Calendar,
  CalendarEvent,
  InitContext,
  Provider,
  ProviderFactory,
  TimeRange,
} from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLIENT_ID = "2eb10680-2809-48cf-8911-2bf9fb82102f";
const REDIRECT_URI = "http://localhost:3000/auth/microsoft/callback";
const AUTHORITY = "https://login.microsoftonline.com/common";
const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

const SCOPES = [
  "Calendars.ReadWrite",
  "User.Read",
  "offline_access",
  "openid",
  "profile",
  "email",
];

// 5 minute buffer before token expiry
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface MicrosoftAuth {
  access: string;
  refresh: string;
  expires: number;
}

interface MicrosoftConfig {
  id: string;
  name: string;
  enabled: boolean;
  auth: MicrosoftAuth;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
  token_type: string;
}

interface GraphCalendar {
  id: string;
  name: string;
  color?: string;
  isDefaultCalendar?: boolean;
}

interface GraphCalendarsResponse {
  value: GraphCalendar[];
}

interface GraphEvent {
  id: string;
  subject: string;
  body?: { content?: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isAllDay: boolean;
  location?: { displayName?: string };
}

interface GraphEventsResponse {
  value: GraphEvent[];
}

class MicrosoftProvider implements Provider {
  readonly name = "Microsoft";
  id: string;
  enabled: boolean;
  private auth: MicrosoftAuth;

  constructor(id: string, auth: MicrosoftAuth, enabled = true) {
    this.id = id;
    this.auth = auth;
    this.enabled = enabled;
  }

  private async ensureValidToken(): Promise<string> {
    if (Date.now() >= this.auth.expires - TOKEN_REFRESH_BUFFER_MS) {
      await this.refreshToken();
    }
    return this.auth.access;
  }

  private async refreshToken(): Promise<void> {
    const tokenUrl = `${AUTHORITY}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: this.auth.refresh,
      scope: SCOPES.join(" "),
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const tokens: TokenResponse = await response.json();

    this.auth = {
      access: tokens.access_token,
      refresh: tokens.refresh_token || this.auth.refresh,
      expires: Date.now() + tokens.expires_in * 1000,
    };
  }

  async init(ctx: InitContext): Promise<boolean> {
    try {
      const { challenge, verifier } = await generatePKCE();

      const authParams = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPES.join(" "),
        response_mode: "query",
        code_challenge: challenge,
        code_challenge_method: "S256",
        state: verifier,
        prompt: "consent",
      });

      const authUrl = `${AUTHORITY}/oauth2/v2.0/authorize?${authParams.toString()}`;

      await ctx.openBrowser(authUrl);

      const code = await ctx.waitForCallback(async (req, res) => {
        const url = new URL(req.url!, REDIRECT_URI);

        if (url.pathname === "/auth/microsoft/callback") {
          const returnedCode = url.searchParams.get("code");
          const error = url.searchParams.get("error");
          const errorDescription = url.searchParams.get("error_description");

          if (error) {
            res.writeHead(400, { "Content-Type": "text/html" });
            const html = (
              await Bun.file(
                path.join(__dirname, "..", "auth", "html", "error-oauth.html"),
              ).text()
            ).replace("{{error}}", errorDescription || error);
            res.end(html);
            throw new Error(`OAuth error: ${errorDescription || error}`);
          }

          if (!returnedCode) {
            res.writeHead(400, { "Content-Type": "text/html" });
            const html = await Bun.file(
              path.join(__dirname, "..", "auth", "html", "error-no-code.html"),
            ).text();
            res.end(html);
            throw new Error("No authorization code received");
          }

          res.writeHead(200, { "Content-Type": "text/html" });
          const html = await Bun.file(
            path.join(__dirname, "..", "auth", "html", "success.html"),
          ).text();
          res.end(html);

          return returnedCode;
        }

        res.writeHead(404);
        res.end("Not found");
        throw new Error("Not found");
      });

      // Exchange authorization code for tokens
      const tokenUrl = `${AUTHORITY}/oauth2/v2.0/token`;

      const tokenParams = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
        scope: SCOPES.join(" "),
      });

      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Failed to exchange code for tokens: ${error}`);
      }

      const tokens: TokenResponse = await tokenResponse.json();

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Failed to receive valid tokens");
      }

      this.auth = {
        access: tokens.access_token,
        refresh: tokens.refresh_token,
        expires: Date.now() + tokens.expires_in * 1000,
      };

      // Extract user ID (email) from ID token
      this.id = this.extractUserEmail(tokens.id_token);

      return true;
    } catch (error) {
      logger.error(`Failed to authenticate with Microsoft: ${error}`);
      return false;
    }
  }

  private extractUserEmail(idToken?: string): string {
    if (idToken) {
      try {
        const parts = idToken.split(".");
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString(),
          );
          return payload.preferred_username || payload.email || "unknown";
        }
      } catch {
        // Fall through
      }
    }
    return "unknown";
  }

  async getCalendars(): Promise<Calendar[]> {
    const token = await this.ensureValidToken();

    const response = await fetch(`${GRAPH_BASE_URL}/me/calendars`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch calendars: ${error}`);
    }

    const data: GraphCalendarsResponse = await response.json();

    return data.value.map((cal) => ({
      id: cal.id,
      name: cal.name,
      color: cal.color ?? undefined,
      primary: cal.isDefaultCalendar || false,
    }));
  }

  async getEvents(range: TimeRange): Promise<CalendarEvent[]> {
    const token = await this.ensureValidToken();
    const calendars = await this.getCalendars();
    const allEvents: CalendarEvent[] = [];

    for (const calendar of calendars) {
      const params = new URLSearchParams({
        startDateTime: range.start.toISOString(),
        endDateTime: range.end.toISOString(),
      });

      const response = await fetch(
        `${GRAPH_BASE_URL}/me/calendars/${calendar.id}/calendarView?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Prefer: 'outlook.timezone="UTC"',
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error(
          `Failed to fetch events for calendar ${calendar.id}: ${error}`,
        );
        continue;
      }

      const data: GraphEventsResponse = await response.json();

      for (const event of data.value) {
        if (!event.id || !event.start) continue;

        const startDate = new Date(event.start.dateTime + "Z");
        const endDate = new Date(event.end.dateTime + "Z");

        allEvents.push({
          id: event.id,
          providerId: this.id,
          calendarId: calendar.id,
          summary: event.subject || "(No title)",
          description: event.body?.content ?? undefined,
          start: startDate,
          end: endDate,
          allDay: event.isAllDay,
          location: event.location?.displayName ?? undefined,
        });
      }
    }

    return allEvents;
  }

  toJSON(): MicrosoftConfig {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      auth: this.auth,
    };
  }
}

const microsoftFactory: ProviderFactory = {
  name: "Microsoft",

  create(): Provider {
    return new MicrosoftProvider("", { access: "", refresh: "", expires: 0 });
  },

  fromConfig(config: unknown): Provider {
    const c = config as MicrosoftConfig;
    return new MicrosoftProvider(c.id, c.auth, c.enabled);
  },
};

export { MicrosoftProvider, microsoftFactory };
