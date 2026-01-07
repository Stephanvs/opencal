#!/usr/bin/env bun

/**
 * Version Helper Module
 *
 * Provides version and channel information for build and publish scripts.
 * Sources version from environment variables (for CI) or package.json (for local builds).
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read package.json for fallback version
const packageJsonPath = path.resolve(__dirname, "../package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

/**
 * Get the version string.
 * Priority: OPENCAL_VERSION env var > package.json version
 */
function getVersion(): string {
  return process.env.OPENCAL_VERSION || packageJson.version || "0.0.0"
}

/**
 * Get the release channel.
 * Priority: OPENCAL_CHANNEL env var > derived from version
 *
 * If version contains "-" (e.g., "0.1.0-beta.1"), it's a preview release.
 * Otherwise, it's a stable "latest" release.
 */
function getChannel(): string {
  if (process.env.OPENCAL_CHANNEL) {
    return process.env.OPENCAL_CHANNEL
  }
  return getVersion().includes("-") ? "preview" : "latest"
}

/**
 * Check if this is a preview/prerelease version.
 */
function isPreview(): boolean {
  return getVersion().includes("-")
}

export const Script = {
  /** The version string (e.g., "0.1.0" or "0.1.0-beta.1") */
  get version(): string {
    return getVersion()
  },

  /** The release channel ("latest" or "preview") */
  get channel(): string {
    return getChannel()
  },

  /** Whether this is a preview/prerelease version */
  get preview(): boolean {
    return isPreview()
  },
}
