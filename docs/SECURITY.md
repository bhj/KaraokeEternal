# Security

This document describes the security model and hardening measures for Karaoke Eternal Automated Edition.

## Threat Model

The system handles:
- **User authentication** via external identity provider (Authentik)
- **Multi-tenant room access** with guest enrollment
- **Session management** via cookies

Primary threats:
- Header spoofing to impersonate users
- Direct backend access bypassing authentication
- Session hijacking
- Guest account persistence beyond intended lifetime

## Security Controls

| Risk | Mitigation |
|------|------------|
| Header spoofing | `KES_REQUIRE_PROXY=true` + IP whitelist (`KES_TRUSTED_PROXIES`) |
| Direct port access | Never expose port 3000; always use reverse proxy |
| Cookie theft | `httpOnly`, `Secure`, `SameSite=Lax` flags |
| Guest persistence | 7-day auto-expiration via Authentik policy |
| SSO logout loop | Redirect to IdP signout before clearing client state |

## Configuration Hardening

### Required Settings

```bash
# Trust only proxy-injected headers
KES_REQUIRE_PROXY=true

# Whitelist your proxy IPs
KES_TRUSTED_PROXIES=127.0.0.1,::1,10.0.0.0/8
```

### HTTPS Requirement

Secure cookies require HTTPS. The reverse proxy should:
- Terminate TLS
- Set `X-Forwarded-Proto: https`
- Forward authentication headers

### Bypass Endpoints

Only these endpoints bypass Authentik authentication:

| Endpoint | Purpose | Risk Level |
|----------|---------|------------|
| `/join*` | Landing page | Low — shows room name only |
| `/api/rooms/join/*/*` | QR validation | Low — validates UUID tokens |

Both endpoints validate input before any action.

## Session Management

- **Session cookie**: `keToken` (httpOnly, Secure, SameSite=Lax)
- **Room cookie**: `kfRoomId` (tracks current room)
- **Logout flow**: Client → IdP signout → Clear local state

See [security_audit_oidc_signout_2026_01_26.md](analysis/security_audit_oidc_signout_2026_01_26.md) for logout security details.

## Guest Account Lifecycle

1. Guest scans QR code
2. Server creates/validates Authentik invitation
3. Authentik enrollment creates user with:
   - `karaoke_room_id` attribute (room binding)
   - 7-day expiration (via `set-guest-expiry-and-room` policy)
4. Guest session ends when:
   - User logs out
   - Account expires (7 days)
   - Admin revokes access

## Audit Logs

Security-relevant events are logged:
- Authentication attempts (success/failure)
- Role changes (admin promotion/demotion)
- Room creation/deletion

Logs do not contain tokens or credentials.

## Related Documentation

- [Architecture](ARCHITECTURE.md) — System overview
- [Authentik Setup](AUTHENTIK_SETUP.md) — SSO configuration
- [Security Audit (2026-01-23)](analysis/security_audit_2026_01_23.md)
- [OIDC Signout Audit (2026-01-26)](analysis/security_audit_oidc_signout_2026_01_26.md)
