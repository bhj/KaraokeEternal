# Authentik Setup

This guide covers configuring Authentik as the identity provider for Karaoke Eternal.

## Prerequisites

- Authentik instance running and accessible
- Admin access to create applications, providers, and flows
- Caddy (or similar) reverse proxy

## 1. Property Mapping (Guest Room Header)

Create a Property Mapping to pass the guest's room assignment via headers.

**Name:** `karaoke-room-id`

**Expression** (Proxy Provider forward-auth):

```python
return {
    "ak_proxy": {
        "user_attributes": {
            "additionalHeaders": {
                "X-Authentik-Karaoke-Room-Id": request.user.attributes.get("karaoke_room_id", "")
            }
        }
    }
}
```

Assign this mapping to your Proxy Provider under **Property Mappings**.

## 2. Caddy Configuration

Two endpoints must bypass Authentik:
1. **Landing page** (`/join*`) — Shows room preview and login options
2. **Smart QR API** (`/api/rooms/join/*`) — Validates invitations and routes users

```caddyfile
karaoke.example.com {
    # Proxy outpost endpoints
    reverse_proxy /outpost.goauthentik.io/* authentik:9000

    # Landing page - bypass auth (shows join options)
    @landing_page path /join*
    handle @landing_page {
        reverse_proxy karaoke:3000
    }

    # Smart QR API - bypass auth (app handles routing)
    @guest_join path /api/rooms/join/*/*
    handle @guest_join {
        reverse_proxy karaoke:3000
    }

    # Everything else - require Authentik auth
    handle {
        forward_auth authentik:9000 {
            uri /outpost.goauthentik.io/auth/caddy
            copy_headers X-Authentik-Username X-Authentik-Groups X-Authentik-Karaoke-Room-Id
        }
        reverse_proxy karaoke:3000
    }
}
```

**Important:** Bypass handlers MUST come before the default `handle` block.

### Security Notes

- `/join*` only shows room name preview — no sensitive data exposed
- `/api/rooms/join/*` validates UUIDs (2^122 entropy) before any action
- Logged-in users: validates invite, sets cookie, redirects to library
- Guests: redirects to Authentik enrollment flow

## 3. Guest Enrollment Flow

Create an enrollment flow (`karaoke-guest-enrollment`) with these stages:

| Stage | Purpose |
|-------|---------|
| **Invitation** | Validates `itoken` (continue without invitation enabled) |
| **Prompt** | Captures `guest_name` (pre-filled from URL param) |
| **User Write** | Creates user with policy `set-guest-expiry-and-room` |
| **Login** | Issues session cookie |
| **Redirect** | Returns to `/` to complete room join |

### On-Demand Invitation Creation

The app automatically validates and creates Authentik invitations:
- When a guest requests enrollment, the server checks if the room's invitation is still valid
- If expired or missing, a new invitation is created via Authentik API
- This ensures guests can always enroll even hours after room creation

### Guest Join Flow

```
Guest scans QR → /api/rooms/join/{roomId}/{itoken}
  → Redirects to /join?itoken=xxx&guest_name=RedPenguin
  → Landing page: "Login with Account" or "Join as RedPenguin"
  → Guest clicks join → GET /api/rooms/{id}/enrollment
  → Server validates/creates invitation on-demand
  → Redirect to Authentik enrollment
  → Account created → Redirect to /
  → App routes to room via SSO headers
```

See [invitation_fix_2026_01_25.md](analysis/invitation_fix_2026_01_25.md) for implementation details.

## 4. Environment Variables

Configure these variables in your Karaoke Eternal deployment:

### Required for SSO

| Variable | Description | Example |
|----------|-------------|---------|
| `KES_REQUIRE_PROXY` | Trust proxy headers only | `true` |
| `KES_TRUSTED_PROXIES` | Allowed proxy IPs | `127.0.0.1,::1` |

### SSO Headers

| Variable | Default | Description |
|----------|---------|-------------|
| `KES_AUTH_HEADER` | `X-Authentik-Username` | Username header |
| `KES_GROUPS_HEADER` | `X-Authentik-Groups` | Groups header |
| `KES_ADMIN_GROUP` | `karaoke-admins` | Admin group name |
| `KES_GUEST_GROUP` | `karaoke-guests` | Guest group name |
| `KES_SSO_SIGNOUT_URL` | — | Logout redirect URL |

### Authentik API (Guest Invitations)

| Variable | Description |
|----------|-------------|
| `KES_AUTHENTIK_URL` | Internal API URL (e.g., `http://authentik:9000`) |
| `KES_AUTHENTIK_PUBLIC_URL` | Public URL for redirects |
| `KES_AUTHENTIK_API_TOKEN` | API token with invitation permissions |
| `KES_AUTHENTIK_ENROLLMENT_FLOW` | Flow slug (default: `karaoke-guest-enrollment`) |

## Troubleshooting

See [troubleshooting-auth-flow.md](operations/troubleshooting-auth-flow.md) for common issues.

## Related Documentation

- [Architecture](ARCHITECTURE.md) — System overview
- [Security](SECURITY.md) — Security model
- [Guest Enrollment Details](operations/authentik-guest-enrollment.md)
