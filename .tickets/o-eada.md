---
id: o-eada
status: closed
deps: []
links: []
created: 2026-01-05T10:46:40Z
type: feature
priority: 2
assignee: Stephan van Stekelenburg
external-ref: gh-4
---
# Implement token retrieval and Google Calendar API integration in TUI

## Overview
Integrate Google Calendar API into the TUI by retrieving stored tokens and making authenticated API calls.

## Implementation Details

### Token Retrieval
- Check for stored tokens on TUI startup
- Validate token expiry
- Refresh token if needed
- Handle missing/invalid tokens gracefully

### User Experience
- If not authenticated: Show message "Not authenticated. Run 'opencal auth login google'"
- If authenticated: Load and display calendar events
- Auto-refresh tokens when expired

### Tasks
- [x] Add googleapis dependency
- [x] Update Auth context type definition
- [x] Implement token loading on startup
- [x] Implement token validation
- [x] Implement token refresh logic
- [x] Create Google Calendar API client
- [x] Fetch calendar events
- [x] Display events in calendar UI
- [x] Handle authentication errors gracefully

