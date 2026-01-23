<div align="center">

# Karaoke Eternal

### Automated Edition

A **Zero-Touch Party Hosting** fork of [Karaoke Eternal](https://github.com/bhj/KaraokeEternal)

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-20%2B-brightgreen)](https://nodejs.org/)
[![Authentik](https://img.shields.io/badge/SSO-Authentik-fd4b2d)](https://goauthentik.io/)

*No login screens. No user management. Just karaoke.*

---

</div>

## Features

- **SSO Auto-Login** — Authentication handled upstream; land directly in your room
- **Per-User Rooms** — Every standard user gets their own private party room
- **QR Guest Enrollment** — Guests scan a code and join instantly
- **Multi-Tenancy** — Multiple hosts can run separate parties simultaneously
- **Room Roaming** — Standard users can visit other rooms via QR code

---

## Architecture

```
┌─────────┐      ┌─────────────┐      ┌──────────┐
│  User   │─────▶│    Caddy    │─────▶│ Karaoke  │
└─────────┘      │   Proxy     │      │   App    │
                 └──────┬──────┘      └──────────┘
                        │ forward_auth
                 ┌──────▼──────┐
                 │  Authentik  │
                 └─────────────┘
```

The app trusts headers from the reverse proxy (`KES_REQUIRE_PROXY=true`):

| Header | Purpose |
|--------|---------|
| `X-Authentik-Username` | User identity |
| `X-Authentik-Groups` | Role assignment (admin/standard/guest) |
| `X-Authentik-Karaoke-Room-Id` | Guest room routing |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Reverse Proxy** (Caddy recommended)
- **Identity Provider** (Authentik)
- **SQLite** (bundled)

### Installation

```bash
git clone https://github.com/Zardoz8901/KaraokeEternalAutomated.git
cd KaraokeEternalAutomated
npm install
npm run build
```

### Running

```bash
# Development
npm run dev

# Production
npm start
```

---

## Configuration

<details>
<summary><strong>Required Environment Variables</strong></summary>

| Variable | Description | Example |
|----------|-------------|---------|
| `KES_REQUIRE_PROXY` | Trust proxy headers only | `true` |
| `KES_TRUSTED_PROXIES` | Allowed proxy IPs | `127.0.0.1,::1` |

</details>

<details>
<summary><strong>SSO Headers</strong></summary>

| Variable | Default | Description |
|----------|---------|-------------|
| `KES_AUTH_HEADER` | `X-Authentik-Username` | Username header |
| `KES_GROUPS_HEADER` | `X-Authentik-Groups` | Groups header |
| `KES_ADMIN_GROUP` | `karaoke-admins` | Admin group name |
| `KES_GUEST_GROUP` | `karaoke-guests` | Guest group name |
| `KES_SSO_SIGNOUT_URL` | — | Logout redirect (e.g., `/outpost.goauthentik.io/sign_out`) |

</details>

<details>
<summary><strong>Authentik API (Guest Invitations)</strong></summary>

| Variable | Description |
|----------|-------------|
| `KES_AUTHENTIK_URL` | Internal API URL (e.g., `http://authentik:9000`) |
| `KES_AUTHENTIK_PUBLIC_URL` | Public URL for redirects (e.g., `https://auth.example.com`) |
| `KES_AUTHENTIK_API_TOKEN` | API token with invitation permissions |
| `KES_AUTHENTIK_ENROLLMENT_FLOW` | Flow slug (default: `karaoke-guest-enrollment`) |

</details>

---

## Authentik Setup

### 1. Property Mapping (Guest Room Header)

Create a Property Mapping to pass the guest's room assignment.

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

> Assign this mapping to your Proxy Provider under **Property Mappings**.

### 2. Caddy Configuration

The Smart QR endpoint must bypass Authentik so the app can handle routing logic (redirect logged-in users vs. send guests to enrollment).

```caddyfile
karaoke.example.com {
    # Smart QR endpoint - bypass auth (app handles routing)
    @guest_join path /api/rooms/join/*
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

> **Important:** The `@guest_join` handler MUST come before the default `handle` block.

**Why this is safe:**
- Logged-in users: app validates invite code, sets cookie, redirects to `/`
- Guests: app redirects to Authentik enrollment with invite token
- No sensitive data exposed; UUIDs are unguessable (2^122 possibilities)

### 3. Guest Enrollment Flow

Create an enrollment flow with stages:

1. **Invitation** — Validates invite token
2. **Prompt** — Collects guest display name
3. **User Write** — Creates user with `karaoke_room_id` attribute
4. **Login** — Authenticates the new user

**Expiration:**
- Invitations: **8 hours**
- Guest users: **7 days** (via `goauthentik.io/user/expires`)

---

## Security

| Risk | Mitigation |
|------|------------|
| Header spoofing | `KES_REQUIRE_PROXY=true` + IP whitelist |
| Direct port access | Never expose 8280; use reverse proxy |
| Cookie theft | `httpOnly`, `Secure`, `SameSite=Lax` |
| Guest persistence | 7-day auto-expiration |

> **HTTPS required** for secure cookies.

---

## Running Tests

```bash
npm test
```

---

## Built With

- [Koa](https://koajs.com/) — Web framework
- [Socket.io](https://socket.io/) — Real-time communication
- [SQLite](https://sqlite.org/) — Database
- [React](https://react.dev/) — Frontend
- [Authentik](https://goauthentik.io/) — Identity Provider

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

[ISC License](LICENSE) — Forked from [Karaoke Eternal](https://github.com/bhj/KaraokeEternal) by RadRoot LLC.

---

## Acknowledgments

- [bhj/KaraokeEternal](https://github.com/bhj/KaraokeEternal) — Original project
- [Authentik](https://goauthentik.io/) — Identity provider
