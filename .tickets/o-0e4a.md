---
id: o-0e4a
status: closed
deps: []
links: []
created: 2026-01-05T10:46:28Z
type: feature
priority: 2
assignee: Stephan van Stekelenburg
external-ref: gh-6
---
# Implement server-based OAuth redirect page for seamless auth flow

To improve the OAuth user experience, implement a hosted redirect page that extracts and displays the authorization code from the URL, allowing users to easily copy it instead of manually inspecting the URL bar.

**Tech Stack:**
- Cloudflare Worker for hosting
- Hono.js as the routing library

**Requirements:**
- Host a page at the registered redirect URI (e.g., https://opencal-auth.example.com/callback)
- Extract the 'code' query parameter from the URL
- Display the code in a user-friendly UI with a 'Copy to Clipboard' button
- Handle errors gracefully (e.g., if 'error' param is present)
- Ensure the page is secure (HTTPS, no logging of sensitive data)

**Steps:**
1. Set up Cloudflare Worker with Hono.js
2. Create the redirect page route
3. Update OAuth config to use the new redirect URI
4. Test the flow end-to-end

This will make the auth flow almost seamless for users.

