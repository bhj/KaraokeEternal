# Architecture

This document describes the system architecture for Karaoke Eternal Automated Edition.

## System Overview

```mermaid
flowchart LR
    subgraph Public
        User([User])
        QR[QR Code]
    end

    subgraph Caddy[Caddy Proxy]
        bypass["/join*, /api/rooms/join/*"]
        auth[forward_auth]
    end

    subgraph Backend
        App[Karaoke App]
        Authentik[Authentik SSO]
    end

    User --> Caddy
    QR -.-> User
    bypass --> App
    auth --> Authentik
    Authentik --> App
```

## User Flows

### QR Code Join Flow

```mermaid
flowchart TD
    QR[Scan QR Code] --> API["/api/rooms/join/{id}/{token}"]
    API --> LoggedIn{Logged in?}

    LoggedIn -->|Yes| SetCookie[Set room cookie]
    SetCookie --> Library[Go to Library]

    LoggedIn -->|No| Landing["/join?itoken=xxx"]
    Landing --> Choice{User choice}

    Choice -->|Login with Account| Outpost[Authentik Outpost]
    Outpost --> Landing

    Choice -->|Join as Guest| Enroll[Authentik Enrollment]
    Enroll --> Landing
```

## Proxy Headers

The app trusts headers from the reverse proxy when `KES_REQUIRE_PROXY=true`:

| Header | Purpose |
|--------|---------|
| `X-Authentik-Username` | User identity |
| `X-Authentik-Groups` | Role assignment (admin/standard/guest) |
| `X-Authentik-Karaoke-Room-Id` | Guest room routing |

## Components

### Server Stack
- **Koa** — HTTP framework
- **Socket.io** — Real-time queue updates
- **SQLite** — Embedded database
- **better-sqlite3** — Sync SQLite driver

### Client Stack
- **React** — UI framework
- **Redux** — State management
- **Socket.io-client** — Real-time updates

### Infrastructure
- **Caddy** — Reverse proxy with forward_auth
- **Authentik** — Identity provider (OIDC/SAML)

## Data Flow

1. **Authentication**: User → Caddy → Authentik → Headers injected → App
2. **Room Access**: QR scan → Validate token → Set cookie → Route to room
3. **Queue Updates**: Client ↔ Socket.io ↔ Server → Broadcast to room

## Related Documentation

- [Authentik Setup](AUTHENTIK_SETUP.md) — SSO configuration
- [Security](SECURITY.md) — Security model and hardening
- [SSO Overlay Architecture](architecture/sso-overlay.md) — Detailed SSO integration
