# Architecture

This document describes the system architecture for Karaoke Hydra.

## System Overview

```mermaid
flowchart LR
    subgraph Public
        User([User])
        QR[QR Code]
    end

    subgraph Caddy[Caddy Proxy]
        proxy[reverse_proxy]
    end

    subgraph Backend
        App[Karaoke App]
        Authentik[Authentik OIDC]
    end

    User --> Caddy
    QR -.-> User
    proxy --> App
    App <-->|OIDC| Authentik
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

## Authentication

The app uses app-managed OIDC with Authentik:

| OIDC Claim | Purpose |
|------------|---------|
| `preferred_username` | User identity |
| `groups` | Role assignment (admin/standard/guest) |

Guest room assignment is handled via invitation tokens, not headers.

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
- **Caddy** — Reverse proxy (simple passthrough)
- **Authentik** — Identity provider (OIDC)

## Data Flow

1. **Authentication**: User → App → OIDC redirect → Authentik → Callback → App issues JWT
2. **Room Access**: QR scan → Validate token → Set cookie → Route to room
3. **Queue Updates**: Client ↔ Socket.io ↔ Server → Broadcast to room

## Related Documentation

- [Authentik Setup](AUTHENTIK_SETUP.md) — SSO configuration
- [Security](SECURITY.md) — Security model and hardening
- [SSO Overlay Architecture](architecture/sso-overlay.md) — Detailed SSO integration
