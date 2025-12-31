import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CodeChallengeMethod, type Credentials } from "google-auth-library";
import { generatePKCE } from "@openauthjs/openauth/pkce";
import { google } from "googleapis";
import { logger } from "@core/logger";
import type {
  Calendar,
  CalendarEvent,
  CalendarId,
  InitContext,
  Provider,
  ProviderFactory,
  TimeRange,
} from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLIENT_ID =
  "725023205531-qi142osnns4o1n503hj0001lt9smf44d.apps.googleusercontent.com";
const REDIRECT_URI = "http://localhost:3000/auth/google/callback";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "profile",
  "email",
];

// 5 minute buffer before token expiry
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface GoogleAuth {
  access: string;
  refresh: string;
  expires: number;
}

interface GoogleConfig {
  id: string;
  name: string;
  enabled: boolean;
  calendars: Record<CalendarId, { enabled: boolean }>;
  auth: GoogleAuth;
}

function createOAuth2Client() {
  return new google.auth.OAuth2({
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    transporterOptions: {
      fetchImplementation: fetch,
    },
  });
}

class GoogleProvider implements Provider {
  readonly name = "Google";
  id: string;
  enabled: boolean;
  private auth: GoogleAuth;
  private calendarSettings: Record<CalendarId, { enabled: boolean }>;

  constructor(
    id: string,
    auth: GoogleAuth,
    enabled = true,
    calendarSettings: Record<CalendarId, { enabled: boolean }> = {},
  ) {
    this.id = id;
    this.auth = auth;
    this.enabled = enabled;
    this.calendarSettings = calendarSettings;
  }

  private async ensureValidToken(): Promise<string> {
    if (Date.now() >= this.auth.expires - TOKEN_REFRESH_BUFFER_MS) {
      await this.refreshToken();
    }
    return this.auth.access;
  }

  private async refreshToken(): Promise<void> {
    const client = createOAuth2Client();
    client.setCredentials({
      refresh_token: this.auth.refresh,
    });

    const { credentials } = await client.refreshAccessToken();
    this.auth = {
      access: credentials.access_token!,
      refresh: credentials.refresh_token || this.auth.refresh,
      expires: credentials.expiry_date || Date.now() + 3600 * 1000,
    };
  }

  private createCalendarClient(accessToken: string) {
    const client = createOAuth2Client();
    client.setCredentials({ access_token: accessToken });
    return google.calendar({ version: "v3", auth: client });
  }

  async init(ctx: InitContext): Promise<boolean> {
    try {
      const { challenge, verifier } = await generatePKCE();
      const client = createOAuth2Client();

      const authUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
        code_challenge: challenge,
        code_challenge_method: CodeChallengeMethod.S256,
        state: verifier,
      });

      await ctx.openBrowser(authUrl);

      const code = await ctx.waitForCallback(async (req, res) => {
        const url = new URL(req.url!, REDIRECT_URI);

        if (url.pathname === "/auth/google/callback") {
          const returnedCode = url.searchParams.get("code");
          const error = url.searchParams.get("error");

          if (error) {
            res.writeHead(400, { "Content-Type": "text/html" });
            const html = (
              await Bun.file(
                path.join(__dirname, "..", "auth", "html", "error-oauth.html"),
              ).text()
            ).replace("{{error}}", error);
            res.end(html);
            throw new Error(`OAuth error: ${error}`);
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

      const { tokens } = await client.getToken({
        code,
        codeVerifier: verifier,
      });

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Failed to receive valid tokens");
      }

      this.auth = {
        access: tokens.access_token,
        refresh: tokens.refresh_token,
        expires: tokens.expiry_date || Date.now() + 3600 * 1000,
      };

      // Extract user ID from ID token
      this.id = this.extractUserEmail(tokens);

      return true;
    } catch (error) {
      logger.error(`Failed to authenticate with Google: ${error}`);
      return false;
    }
  }

  private extractUserEmail(tokens: Credentials): string {
    if (tokens.id_token) {
      try {
        const parts = tokens.id_token.split(".");
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString(),
          );
          return payload.email || "unknown";
        }
      } catch {
        // Fall through
      }
    }
    return "unknown";
  }

  async getCalendars(): Promise<Calendar[]> {
    const token = await this.ensureValidToken();
    const client = this.createCalendarClient(token);

    const response = await client.calendarList.list();
    const items = response.data.items || [];

    return items.map((cal) => ({
      id: cal.id || "",
      name: cal.summary || "",
      color: cal.backgroundColor ?? undefined,
      primary: cal.primary || false,
      enabled: this.calendarSettings[cal.id || ""]?.enabled ?? true,
    }));
  }

  async getEvents(range: TimeRange): Promise<CalendarEvent[]> {
    const token = await this.ensureValidToken();
    const client = this.createCalendarClient(token);

    const calendars = await this.getCalendars();
    const enabledCalendars = calendars.filter((c) => c.enabled);

    const allEvents: CalendarEvent[] = [];

    for (const calendar of enabledCalendars) {
      const response = await client.events.list({
        calendarId: calendar.id,
        timeMin: range.start.toISOString(),
        timeMax: range.end.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const items = response.data.items || [];

      for (const event of items) {
        if (!event.id || !event.start) continue;

        const startDate = event.start.dateTime
          ? new Date(event.start.dateTime)
          : new Date(`${event.start.date}T00:00:00`);
        const endDate = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : event.end?.date
            ? new Date(`${event.end.date}T23:59:59`)
            : startDate;

        allEvents.push({
          id: event.id,
          providerId: this.id,
          calendarId: calendar.id,
          summary: event.summary || "(No title)",
          description: event.description ?? undefined,
          start: startDate,
          end: endDate,
          allDay: !event.start.dateTime,
          location: event.location ?? undefined,
        });
      }
    }

    return allEvents;
  }

  toJSON(): GoogleConfig {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      calendars: this.calendarSettings,
      auth: this.auth,
    };
  }
}

const googleFactory: ProviderFactory = {
  name: "Google",

  create(): Provider {
    return new GoogleProvider("", { access: "", refresh: "", expires: 0 });
  },

  fromConfig(config: unknown): Provider {
    const c = config as GoogleConfig;
    return new GoogleProvider(c.id, c.auth, c.enabled, c.calendars);
  },
};

export { GoogleProvider, googleFactory };
