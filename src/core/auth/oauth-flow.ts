import {
  createServer,
  IncomingMessage,
  ServerResponse,
  type Server,
} from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import logger from "@core/logger";
import type { Auth } from "@core/account";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface OAuthFlowResult {
  success: boolean;
  tokens?: Auth.Info;
  error?: string;
}

export function waitForOAuthCallback<T>(
  cont: (
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) => T | Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let server: Server | null = null;
    const timeout = setTimeout(
      () => {
        if (server) server.close();
        reject(new Error("OAuth flow timed out after 5 minutes"));
      },
      5 * 60 * 1000,
    ); // 5 minute timeout

    server = createServer(async (req, res) => {
      try {
        const result = await cont(req, res);
        clearTimeout(timeout);
        if (server) server.close();
        resolve(result);
      } catch (error) {
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "text/html" });
          const message =
            error instanceof Error ? error.message : "Unknown error";
          const html = fs
            .readFileSync(
              path.join(__dirname, "html", "error-general.html"),
              "utf8",
            )
            .replace("{{message}}", message);
          res.end(html);
        }
        clearTimeout(timeout);
        if (server) server.close();
        reject(error);
      }
    });

    server.listen(3000, () => {
      logger.info("Waiting for authorization...\n");
    });

    server.on("error", (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start local server: ${error.message}`));
    });
  });
}

export async function openBrowser(url: string): Promise<void> {
  const { platform } = process;
  let command: string;

  switch (platform) {
    case "darwin":
      command = `open "${url}"`;
      break;
    case "win32":
      command = `start "" "${url}"`;
      break;
    default:
      // Linux and others
      command = `xdg-open "${url}" || sensible-browser "${url}" || x-www-browser "${url}"`;
      break;
  }

  try {
    const { exec } = await import("child_process");
    await new Promise<void>((resolve, reject) => {
      exec(command, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    // Fail silently - user can copy URL manually
  }
}
