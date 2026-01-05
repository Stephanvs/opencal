---
id: o-6d8e
status: closed
deps: []
links: []
created: 2026-01-05T10:46:45Z
type: task
priority: 2
assignee: Stephan van Stekelenburg
external-ref: gh-3
---
# Create CLI subcommand structure for authentication

## Overview
Create a CLI subcommand structure to handle authentication outside of the TUI.

## Proposed CLI Structure
```bash
# Authentication commands
opencal auth login google          # Start OAuth flow for Google
opencal auth logout [provider]     # Remove stored tokens
opencal auth status               # Show authentication status
opencal auth refresh              # Manually refresh tokens

# TUI (default behavior)
opencal                           # Launch TUI (main app)
```

## Tasks
- [ ] Create CLI file structure
- [ ] Implement argument parsing
- [ ] Create auth command handler
- [ ] Implement auth login google subcommand
- [ ] Implement auth logout subcommand
- [ ] Implement auth status subcommand
- [ ] Update main entry point to route between CLI and TUI
- [ ] Add help text for commands

