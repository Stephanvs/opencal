#!/usr/bin/env bun

/**
 * OpenCal Build Script
 *
 * Compiles OpenCal binaries for multiple platforms using Bun's bundler.
 *
 * Usage:
 *   bun run script/build.ts              # Build for all platforms
 *   bun run script/build.ts --single     # Build only for current platform
 *   bun run script/build.ts --baseline   # Prefer baseline (non-AVX2) variant with --single
 *   bun run script/build.ts --skip-install  # Skip reinstalling native dependencies
 *
 * Environment variables:
 *   OPENCAL_VERSION  - Override version (default: from package.json)
 *   OPENCAL_CHANNEL  - Release channel: "latest" or "preview"
 */

import { $ } from "bun"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import pkg from "../package.json"
import solidPlugin from "../node_modules/@opentui/solid/scripts/solid-plugin"
import { Script } from "./version"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

// Parse command line flags
const singleFlag = process.argv.includes("--single")
const baselineFlag = process.argv.includes("--baseline")
const skipInstall = process.argv.includes("--skip-install")

/**
 * Build target configuration
 */
interface BuildTarget {
  os: "linux" | "darwin" | "win32"
  arch: "arm64" | "x64"
  abi?: "musl"
  avx2?: false
}

/**
 * All supported build targets (11 total)
 */
const allTargets: BuildTarget[] = [
  // Linux glibc
  { os: "linux", arch: "arm64" },
  { os: "linux", arch: "x64" },
  { os: "linux", arch: "x64", avx2: false },
  // Linux musl
  { os: "linux", arch: "arm64", abi: "musl" },
  { os: "linux", arch: "x64", abi: "musl" },
  { os: "linux", arch: "x64", abi: "musl", avx2: false },
  // macOS
  { os: "darwin", arch: "arm64" },
  { os: "darwin", arch: "x64" },
  { os: "darwin", arch: "x64", avx2: false },
  // Windows
  { os: "win32", arch: "x64" },
  { os: "win32", arch: "x64", avx2: false },
]

/**
 * Filter targets based on command line flags
 */
const targets = singleFlag
  ? allTargets.filter((item) => {
      if (item.os !== process.platform || item.arch !== process.arch) {
        return false
      }
      // When building for current platform, prefer native binary by default
      // Baseline binaries are only built when explicitly requested
      if (item.avx2 === false) {
        return baselineFlag
      }
      return true
    })
  : allTargets

/**
 * Generate package name from target configuration
 * Examples: opencal-linux-x64, opencal-darwin-arm64, opencal-linux-x64-baseline-musl
 */
function getPackageName(target: BuildTarget): string {
  const parts = [
    pkg.name,
    // Use "windows" instead of "win32" for npm package naming
    target.os === "win32" ? "windows" : target.os,
    target.arch,
    target.avx2 === false ? "baseline" : undefined,
    target.abi,
  ]
  return parts.filter(Boolean).join("-")
}

// Clean dist directory
await $`rm -rf dist`

// Track binaries for publishing
const binaries: Record<string, string> = {}

// Install platform-specific native dependencies
if (!skipInstall) {
  console.log("Installing native dependencies for all platforms...")
  await $`bun install --os="*" --cpu="*" @opentui/core@${pkg.dependencies["@opentui/core"]}`
}

// Build for each target
for (const target of targets) {
  const name = getPackageName(target)
  console.log(`Building ${name}...`)

  // Create output directory
  await $`mkdir -p dist/${name}/bin`

  // Find the parser worker file from @opentui/core
  const parserWorkerPath = path.resolve(dir, "./node_modules/@opentui/core/parser.worker.js")
  const parserWorker = fs.existsSync(parserWorkerPath) ? fs.realpathSync(parserWorkerPath) : undefined

  // Use platform-specific bunfs root path
  const bunfsRoot = target.os === "win32" ? "B:/~BUN/root/" : "/$bunfs/root/"

  // Prepare entrypoints
  const entrypoints = ["./src/main.ts"]
  if (parserWorker) {
    entrypoints.push(parserWorker)
  }

  // Prepare defines
  const defines: Record<string, string> = {
    OPENCAL_VERSION: `'${Script.version}'`,
    OPENCAL_CHANNEL: `'${Script.channel}'`,
  }

  // Add worker path define if parser worker exists
  if (parserWorker) {
    const workerRelativePath = path.relative(dir, parserWorker).replaceAll("\\", "/")
    defines.OTUI_TREE_SITTER_WORKER_PATH = bunfsRoot + workerRelativePath
  }

  // Add libc define for Linux
  if (target.os === "linux") {
    defines.OPENCAL_LIBC = `'${target.abi ?? "glibc"}'`
  }

  // Build the binary
  await Bun.build({
    conditions: ["browser"],
    tsconfig: "./tsconfig.json",
    plugins: [solidPlugin],
    sourcemap: "external",
    compile: {
      autoloadBunfig: false,
      autoloadDotenv: false,
      // @ts-expect-error - Bun types may not be up to date
      autoloadTsconfig: true,
      autoloadPackageJson: true,
      target: name.replace(pkg.name, "bun") as Parameters<typeof Bun.build>[0]["compile"] extends { target?: infer T } ? T : never,
      outfile: `dist/${name}/bin/opencal`,
      execArgv: [`--user-agent=opencal/${Script.version}`, "--"],
      windows: {},
    },
    entrypoints,
    define: defines,
  })

  // Create package.json for this platform package
  await Bun.file(`dist/${name}/package.json`).write(
    JSON.stringify(
      {
        name,
        version: Script.version,
        os: [target.os],
        cpu: [target.arch],
      },
      null,
      2,
    ),
  )

  binaries[name] = Script.version
}

console.log(`\nBuild complete! Built ${Object.keys(binaries).length} target(s):`)
for (const name of Object.keys(binaries)) {
  console.log(`  - ${name}`)
}

export { binaries }
