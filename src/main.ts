#!/usr/bin/env bun
const args = Bun.argv.slice(2);

await import("./tui/index.tsx");
