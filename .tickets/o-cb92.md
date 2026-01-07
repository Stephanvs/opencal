---
id: o-cb92
status: closed
deps: []
links: []
created: 2026-01-05T10:46:57Z
type: feature
priority: 2
assignee: Stephan van Stekelenburg
external-ref: gh-1
---
# Implement Google OAuth 2.0 authentication for CLI

## Overview
Implement Google OAuth 2.0 authentication to allow users to authenticate with their Google Calendar account from the CLI.

## Scope
- Set up Google Cloud project and OAuth 2.0 credentials
- Implement device flow OAuth 2.0 for CLI authentication
- Store access and refresh tokens securely

## OAuth Flow Choice
Use **OAuth 2.0 Device Flow** as it's most suitable for CLI applications:
- User runs opencal auth login google
- CLI displays a verification URL and code
- User visits URL on any device to authorize
- CLI polls for authorization completion
- Tokens are saved locally

### Required Scopes
- https://www.googleapis.com/auth/calendar.readonly - Read calendar events
- https://www.googleapis.com/auth/calendar.events - Create/modify events (future)

## Tasks
- [x] Create Google Cloud project
- [x] Enable Google Calendar API
- [x] Create OAuth 2.0 credentials (Device flow)
- [x] Implement device flow authentication
- [x] Display verification URL and code to user
- [x] Poll for authorization completion
- [x] Handle errors and timeouts

