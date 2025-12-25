#!/usr/bin/env bun

/**
 * OpenCal Publish Script
 *
 * Builds and publishes OpenCal packages to npm.
 * Also creates GitHub release archives for stable releases.
 *
 * Usage:
 *   bun run script/publish.ts
 *
 * Environment variables:
 *   OPENCAL_VERSION  - Override version (default: from package.json)
 *   OPENCAL_CHANNEL  - Release channel: "latest" or "preview"
 *   NPM_TOKEN        - npm authentication token
 */

import { $ } from "bun"
import { fileURLToPath } from "node:url"

import pkg from "../package.json"

import { Script } from "./version"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

// Build all targets and get the binaries map
const { binaries } = await import("./build.ts")

// Smoke test: run the binary for current platform
{
  const name = `${pkg.name}-${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`
  console.log(`\nSmoke test: running dist/${name}/bin/opencal --version`)
  await $`./dist/${name}/bin/opencal --version`
}

// Create main package directory
await $`mkdir -p ./dist/${pkg.name}`
await $`mkdir -p ./dist/${pkg.name}/bin`

// Copy postinstall script
await $`cp ./script/postinstall.mjs ./dist/${pkg.name}/postinstall.mjs`

// Create main package.json
await Bun.file(`./dist/${pkg.name}/package.json`).write(
  JSON.stringify(
    {
      name: pkg.name,
      version: Script.version,
      description: "Terminal-based calendar application",
      bin: {
        [pkg.name]: `./bin/${pkg.name}`,
      },
      scripts: {
        postinstall: "node ./postinstall.mjs",
      },
      optionalDependencies: binaries,
      repository: {
        type: "git",
        url: "git+https://github.com/Stephanvs/opencal.git",
      },
      keywords: ["calendar", "terminal", "tui", "cli"],
      author: "Stephan van Stekelenburg",
      license: "MIT",
      bugs: {
        url: "https://github.com/Stephanvs/opencal/issues",
      },
      homepage: "https://github.com/Stephanvs/opencal#readme",
    },
    null,
    2,
  ),
)

// Define npm tags based on channel
const tags = [Script.channel]

console.log(`\nPublishing with tags: ${tags.join(", ")}`)

// Publish platform-specific packages
const tasks = Object.entries(binaries).map(async ([name]) => {
  console.log(`Publishing ${name}...`)

  // Set permissions on non-Windows platforms
  if (process.platform !== "win32") {
    await $`chmod -R 755 .`.cwd(`./dist/${name}`)
  }

  // Pack and publish
  await $`bun pm pack`.cwd(`./dist/${name}`)
  for (const tag of tags) {
    await $`npm publish *.tgz --access public --tag ${tag}`.cwd(`./dist/${name}`)
  }
})

await Promise.all(tasks)

// Publish main package
console.log(`\nPublishing ${pkg.name}...`)
for (const tag of tags) {
  await $`bun pm pack && npm publish *.tgz --access public --tag ${tag}`.cwd(`./dist/${pkg.name}`)
}

// For stable releases, create archives for GitHub release
if (!Script.preview) {
  console.log("\nCreating release archives...")

  for (const key of Object.keys(binaries)) {
    if (key.includes("linux")) {
      // Create .tar.gz for Linux
      await $`tar -czf ../../${key}.tar.gz *`.cwd(`dist/${key}/bin`)
      console.log(`  Created ${key}.tar.gz`)
    } else {
      // Create .zip for macOS and Windows
      await $`zip -r ../../${key}.zip *`.cwd(`dist/${key}/bin`)
      console.log(`  Created ${key}.zip`)
    }
  }

  console.log("\nRelease archives created in dist/")
}

console.log("\nPublish complete!")
console.log(`  Version: ${Script.version}`)
console.log(`  Channel: ${Script.channel}`)
console.log(`  Packages published: ${Object.keys(binaries).length + 1}`)
