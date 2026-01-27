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

# 2. Configure (see below)
export KES_REQUIRE_PROXY=true
export KES_TRUSTED_PROXIES=127.0.0.1,::1

# 3. Run
npm run build && npm start
```

Open `http://localhost:3000` (behind your reverse proxy).

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `KES_REQUIRE_PROXY` | Yes | Trust proxy headers only (`true`) |
| `KES_TRUSTED_PROXIES` | Yes | Allowed proxy IPs |
| `KES_SSO_SIGNOUT_URL` | Recommended | IdP logout URL |

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
