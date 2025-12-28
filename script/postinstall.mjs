#!/usr/bin/env node

/**
 * OpenCal npm Postinstall Script
 *
 * This script runs after npm install to set up the correct platform-specific binary.
 * It detects the current platform and architecture, finds the corresponding
 * optional dependency package, and creates a symlink to the binary.
 *
 * On Windows, this is a no-op since npm handles the .exe directly via the bin field.
 */

import fs from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

/**
 * Detect current platform and architecture
 * @returns {{ platform: string, arch: string }}
 */
function detectPlatformAndArch() {
  // Map platform names to package naming convention
  let platform
  switch (os.platform()) {
    case "darwin":
      platform = "darwin"
      break
    case "linux":
      platform = "linux"
      break
    case "win32":
      platform = "windows"
      break
    default:
      platform = os.platform()
      break
  }

  // Map architecture names
  let arch
  switch (os.arch()) {
    case "x64":
      arch = "x64"
      break
    case "arm64":
      arch = "arm64"
      break
    case "arm":
      arch = "arm"
      break
    default:
      arch = os.arch()
      break
  }

  return { platform, arch }
}

/**
 * Find the binary from the platform-specific package
 * @returns {{ binaryPath: string, binaryName: string }}
 */
function findBinary() {
  const { platform, arch } = detectPlatformAndArch()
  const packageName = `opencal-${platform}-${arch}`
  const binaryName = platform === "windows" ? "opencal.exe" : "opencal"

  try {
    // Use require.resolve to find the package
    const packageJsonPath = require.resolve(`${packageName}/package.json`)
    const packageDir = path.dirname(packageJsonPath)
    const binaryPath = path.join(packageDir, "bin", binaryName)

    if (!fs.existsSync(binaryPath)) {
      throw new Error(`Binary not found at ${binaryPath}`)
    }

    return { binaryPath, binaryName }
  } catch (error) {
    throw new Error(`Could not find package ${packageName}: ${error.message}`)
  }
}

/**
 * Prepare the bin directory and return paths
 * @param {string} binaryName
 * @returns {{ binDir: string, targetPath: string }}
 */
function prepareBinDirectory(binaryName) {
  const binDir = path.join(__dirname, "bin")
  const targetPath = path.join(binDir, binaryName)

  // Ensure bin directory exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true })
  }

  // Remove existing binary/symlink if it exists
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath)
  }

  return { binDir, targetPath }
}

/**
 * Create symlink from source binary to target location
 * @param {string} sourcePath
 * @param {string} binaryName
 */
function symlinkBinary(sourcePath, binaryName) {
  const { targetPath } = prepareBinDirectory(binaryName)

  fs.symlinkSync(sourcePath, targetPath)
  console.log(`opencal binary symlinked: ${targetPath} -> ${sourcePath}`)

  // Verify the file exists after operation
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Failed to symlink binary to ${targetPath}`)
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    if (os.platform() === "win32") {
      // On Windows, the .exe is already included in the package and bin field points to it
      // No postinstall setup needed
      console.log("Windows detected: binary setup not needed (using packaged .exe)")
      return
    }

    const { binaryPath, binaryName } = findBinary()
    symlinkBinary(binaryPath, binaryName)
  } catch (error) {
    console.error("Failed to setup opencal binary:", error.message)
    process.exit(1)
  }
}

try {
  main()
} catch (error) {
  console.error("Postinstall script error:", error.message)
  // Exit with 0 to not fail the install if something goes wrong
  process.exit(0)
}
