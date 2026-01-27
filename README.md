<div align="center">

# Karaoke Eternal

### Automated Edition

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-20%2B-brightgreen)](https://nodejs.org/)
[![Authentik](https://img.shields.io/badge/SSO-Authentik-fd4b2d)](https://goauthentik.io/)

**Multi-tenant karaoke with SSO. Guests scan a QR code and sing.**

</div>

---

## Features

- **SSO Login** — Authenticate via Authentik
- **Per-User Rooms** — Each user gets their own party space
- **QR Guest Enrollment** — One scan, one click, singing
- **Multi-Tenancy** — Multiple hosts, simultaneous parties
- **Room Roaming** — Visit other rooms via QR

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Zardoz8901/KaraokeEternalAutomated.git
cd KaraokeEternalAutomated
npm install

# 2. Configure OIDC (see below)
export KES_OIDC_ISSUER_URL=https://auth.example.com/application/o/karaoke-eternal/
export KES_OIDC_CLIENT_ID=your-client-id
export KES_OIDC_CLIENT_SECRET=your-client-secret

# 3. Run
npm run build && npm start
```

Open `http://localhost:3000` (behind your reverse proxy).

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `KES_OIDC_ISSUER_URL` | Yes | OIDC issuer URL from Authentik |
| `KES_OIDC_CLIENT_ID` | Yes | OAuth2 client ID |
| `KES_OIDC_CLIENT_SECRET` | Yes | OAuth2 client secret |
| `KES_ADMIN_GROUP` | Yes | Authentik group name for admins |
| `KES_GUEST_GROUP` | Yes | Authentik group name for guests |

Full configuration: [docs/AUTHENTIK_SETUP.md](docs/AUTHENTIK_SETUP.md#4-environment-variables)

---

## Documentation

| Topic | Link |
|-------|------|
| **Authentik Setup** | [docs/AUTHENTIK_SETUP.md](docs/AUTHENTIK_SETUP.md) |
| **Architecture** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Security** | [docs/SECURITY.md](docs/SECURITY.md) |

---

## Development

```bash
npm run dev    # Development server
npm test       # Run tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Built With

[Koa](https://koajs.com/) | [Socket.io](https://socket.io/) | [SQLite](https://sqlite.org/) | [React](https://react.dev/) | [Authentik](https://goauthentik.io/)

---

## License

[ISC License](LICENSE) — Forked from [Karaoke Eternal](https://github.com/bhj/KaraokeEternal) by RadRoot LLC.
