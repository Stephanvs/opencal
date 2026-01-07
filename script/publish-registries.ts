#!/usr/bin/env bun

/**
 * OpenCal Registry Publishing Script
 *
 * Publishes OpenCal to package registries:
 * - Arch Linux AUR (opencal-bin and opencal packages)
 * - Homebrew (Stephanvs/homebrew-tap)
 *
 * This script only runs for stable releases (non-preview versions).
 *
 * Usage:
 *   bun run script/publish-registries.ts
 *
 * Environment variables:
 *   OPENCAL_VERSION  - Override version (default: from package.json)
 *   OPENCAL_CHANNEL  - Release channel: "latest" or "preview"
 *   AUR_SSH_KEY      - SSH private key for AUR push
 *   GITHUB_TOKEN     - GitHub token for pushing to homebrew-tap
 */

import { $ } from "bun"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { Script } from "./version"

// Biome doesn't understand shell template strings, so we disable the lint for those
/* biome-ignore-all lint/style/noUnusedTemplateLiteral: shell template strings */

// Only run for stable releases
if (Script.preview) {
  console.log("Skipping registry publishing for preview release")
  process.exit(0)
}

console.log(`Publishing to registries for version ${Script.version}`)

// Calculate SHA256 checksums for release archives
const arm64Sha = await $`sha256sum ./dist/opencal-linux-arm64.tar.gz | cut -d' ' -f1`.text().then((x) => x.trim())
const x64Sha = await $`sha256sum ./dist/opencal-linux-x64.tar.gz | cut -d' ' -f1`.text().then((x) => x.trim())
const macX64Sha = await $`sha256sum ./dist/opencal-darwin-x64.zip | cut -d' ' -f1`.text().then((x) => x.trim())
const macArm64Sha = await $`sha256sum ./dist/opencal-darwin-arm64.zip | cut -d' ' -f1`.text().then((x) => x.trim())

// Parse version for PKGBUILD (handle prerelease suffixes)
const [pkgver, _subver = ""] = Script.version.split(/(-.*)/, 2)

// =============================================================================
// AUR Publishing
// =============================================================================

/**
 * Set up SSH for AUR authentication
 */
async function setupAurSsh(): Promise<string | null> {
  const aurSshKey = process.env.AUR_SSH_KEY
  if (!aurSshKey) {
    console.warn("AUR_SSH_KEY not set, skipping AUR publishing")
    return null
  }

  // Write SSH key to temp file
  const sshKeyPath = path.join(os.tmpdir(), "aur_ssh_key")
  fs.writeFileSync(sshKeyPath, `${aurSshKey}\n`, { mode: 0o600 })

  // Return GIT_SSH_COMMAND for use with git
  return `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no`
}

/**
 * PKGBUILD for opencal-bin (prebuilt binary package)
 */
const binaryPkgbuild = [
  "# Maintainer: Stephan van Stekelenburg",
  "",
  "pkgname='opencal-bin'",
  `pkgver=${pkgver}`,
  `_subver=${_subver}`,
  "options=('!debug' '!strip')",
  "pkgrel=1",
  "pkgdesc='Terminal-based calendar application'",
  "url='https://github.com/Stephanvs/opencal'",
  "arch=('aarch64' 'x86_64')",
  "license=('MIT')",
  "provides=('opencal')",
  "conflicts=('opencal')",
  "",
  `source_aarch64=("\${pkgname}_\${pkgver}_aarch64.tar.gz::https://github.com/Stephanvs/opencal/releases/download/v\${pkgver}\${_subver}/opencal-linux-arm64.tar.gz")`,
  `sha256sums_aarch64=('${arm64Sha}')`,
  "",
  `source_x86_64=("\${pkgname}_\${pkgver}_x86_64.tar.gz::https://github.com/Stephanvs/opencal/releases/download/v\${pkgver}\${_subver}/opencal-linux-x64.tar.gz")`,
  `sha256sums_x86_64=('${x64Sha}')`,
  "",
  "package() {",
  '  install -Dm755 ./opencal "${pkgdir}/usr/bin/opencal"',
  "}",
  "",
].join("\n")

/**
 * PKGBUILD for opencal (source-based package)
 */
const sourcePkgbuild = [
  "# Maintainer: Stephan van Stekelenburg",
  "",
  "pkgname='opencal'",
  `pkgver=${pkgver}`,
  `_subver=${_subver}`,
  "options=('!debug' '!strip')",
  "pkgrel=1",
  "pkgdesc='Terminal-based calendar application'",
  "url='https://github.com/Stephanvs/opencal'",
  "arch=('aarch64' 'x86_64')",
  "license=('MIT')",
  "provides=('opencal')",
  "conflicts=('opencal-bin')",
  "makedepends=('git' 'bun-bin')",
  "",
  `source=("opencal-\${pkgver}.tar.gz::https://github.com/Stephanvs/opencal/archive/v\${pkgver}\${_subver}.tar.gz")`,
  `sha256sums=('SKIP')`,
  "",
  "build() {",
  `  cd "opencal-\${pkgver}"`,
  "  bun install",
  `  OPENCAL_CHANNEL=latest OPENCAL_VERSION=\${pkgver} bun run ./script/build.ts --single`,
  "}",
  "",
  "package() {",
  `  cd "opencal-\${pkgver}"`,
  '  mkdir -p "${pkgdir}/usr/bin"',
  '  target_arch="x64"',
  '  case "$CARCH" in',
  '    x86_64) target_arch="x64" ;;',
  '    aarch64) target_arch="arm64" ;;',
  '    *) printf "unsupported architecture: %s\\n" "$CARCH" >&2 ; return 1 ;;',
  "  esac",
  '  libc=""',
  "  if command -v ldd >/dev/null 2>&1; then",
  "    if ldd --version 2>&1 | grep -qi musl; then",
  '      libc="-musl"',
  "    fi",
  "  fi",
  '  if [ -z "$libc" ] && ls /lib/ld-musl-* >/dev/null 2>&1; then',
  '    libc="-musl"',
  "  fi",
  '  base=""',
  '  if [ "$target_arch" = "x64" ]; then',
  "    if ! grep -qi avx2 /proc/cpuinfo 2>/dev/null; then",
  '      base="-baseline"',
  "    fi",
  "  fi",
  '  bin="dist/opencal-linux-${target_arch}${base}${libc}/bin/opencal"',
  '  if [ ! -f "$bin" ]; then',
  '    printf "unable to find binary for %s%s%s\\n" "$target_arch" "$base" "$libc" >&2',
  "    return 1",
  "  fi",
  '  install -Dm755 "$bin" "${pkgdir}/usr/bin/opencal"',
  "}",
  "",
].join("\n")

// Publish to AUR
const gitSshCommand = await setupAurSsh()
if (gitSshCommand) {
  for (const [pkg, pkgbuild] of [
    ["opencal-bin", binaryPkgbuild],
    ["opencal", sourcePkgbuild],
  ] as const) {
    console.log(`\nPublishing to AUR: ${pkg}`)

    // Retry loop for AUR push (network issues can cause transient failures)
    for (let i = 0; i < 30; i++) {
      try {
        await $`rm -rf ./dist/aur-${pkg}`

        // Clone with custom SSH command
        await $`GIT_SSH_COMMAND=${gitSshCommand} git clone ssh://aur@aur.archlinux.org/${pkg}.git ./dist/aur-${pkg}`
        await $`git checkout master`.cwd(`./dist/aur-${pkg}`)

        // Write PKGBUILD
        await Bun.file(`./dist/aur-${pkg}/PKGBUILD`).write(pkgbuild)

        // Generate .SRCINFO
        await $`makepkg --printsrcinfo > .SRCINFO`.cwd(`./dist/aur-${pkg}`)

        // Commit and push
        await $`git add PKGBUILD .SRCINFO`.cwd(`./dist/aur-${pkg}`)
        await $`git commit -m "Update to v${Script.version}"`.cwd(`./dist/aur-${pkg}`)
        await $`GIT_SSH_COMMAND=${gitSshCommand} git push`.cwd(`./dist/aur-${pkg}`)

        console.log(`  Successfully published ${pkg} to AUR`)
        break
      } catch (_error) {
        if (i === 29) {
          console.error(`  Failed to publish ${pkg} to AUR after 30 attempts`)
        }
        // Retry on next iteration
      }
    }
  }
}

// =============================================================================
// Homebrew Publishing
// =============================================================================

const githubToken = process.env.GITHUB_TOKEN
if (!githubToken) {
  console.warn("\nGITHUB_TOKEN not set, skipping Homebrew publishing")
} else {
  console.log("\nPublishing to Homebrew tap...")

  /**
   * Homebrew formula for OpenCal
   */
  const homebrewFormula = [
    "# typed: false",
    "# frozen_string_literal: true",
    "",
    "# This file was generated by the OpenCal publish script. DO NOT EDIT.",
    "class Opencal < Formula",
    `  desc "Terminal-based calendar application"`,
    `  homepage "https://github.com/Stephanvs/opencal"`,
    `  version "${Script.version.split("-")[0]}"`,
    "",
    "  on_macos do",
    "    if Hardware::CPU.intel?",
    `      url "https://github.com/Stephanvs/opencal/releases/download/v${Script.version}/opencal-darwin-x64.zip"`,
    `      sha256 "${macX64Sha}"`,
    "",
    "      def install",
    '        bin.install "opencal"',
    "      end",
    "    end",
    "    if Hardware::CPU.arm?",
    `      url "https://github.com/Stephanvs/opencal/releases/download/v${Script.version}/opencal-darwin-arm64.zip"`,
    `      sha256 "${macArm64Sha}"`,
    "",
    "      def install",
    '        bin.install "opencal"',
    "      end",
    "    end",
    "  end",
    "",
    "  on_linux do",
    "    if Hardware::CPU.intel? && Hardware::CPU.is_64_bit?",
    `      url "https://github.com/Stephanvs/opencal/releases/download/v${Script.version}/opencal-linux-x64.tar.gz"`,
    `      sha256 "${x64Sha}"`,
    "",
    "      def install",
    '        bin.install "opencal"',
    "      end",
    "    end",
    "    if Hardware::CPU.arm? && Hardware::CPU.is_64_bit?",
    `      url "https://github.com/Stephanvs/opencal/releases/download/v${Script.version}/opencal-linux-arm64.tar.gz"`,
    `      sha256 "${arm64Sha}"`,
    "",
    "      def install",
    '        bin.install "opencal"',
    "      end",
    "    end",
    "  end",
    "end",
    "",
  ].join("\n")

  try {
    await $`rm -rf ./dist/homebrew-tap`
    await $`git clone https://${githubToken}@github.com/Stephanvs/homebrew-tap.git ./dist/homebrew-tap`

    await Bun.file("./dist/homebrew-tap/opencal.rb").write(homebrewFormula)

    await $`git add opencal.rb`.cwd(`./dist/homebrew-tap`)
    await $`git commit -m "Update opencal to v${Script.version}"`.cwd(`./dist/homebrew-tap`)
    await $`git push`.cwd(`./dist/homebrew-tap`)

    console.log("  Successfully published to Homebrew tap")
  } catch (error) {
    console.error("  Failed to publish to Homebrew tap:", error)
  }
}

console.log("\nRegistry publishing complete!")
