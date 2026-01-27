# Authentik Setup

This guide covers configuring Authentik as the identity provider for Karaoke Eternal.

## Prerequisites

- Authentik instance running and accessible
- Admin access to create applications and providers
- Caddy (or similar) reverse proxy

## 1. Create OAuth2/OIDC Provider

In Authentik Admin → Applications → Providers → Create:

| Setting | Value |
|---------|-------|
| **Name** | `karaoke-eternal` |
| **Authorization flow** | `default-provider-authorization-implicit-consent` |
| **Client type** | Confidential |
| **Client ID** | (auto-generated, copy this) |
| **Client Secret** | (auto-generated, copy this) |
| **Redirect URIs** | `https://karaoke.example.com/api/auth/callback` |
| **Signing Key** | Select your signing key |

### Scopes

Enable these scopes:
- `openid`
- `profile`
- `email`
- `groups` (requires scope mapping, see below)

### Groups Scope Mapping

Create a Property Mapping (Applications → Property Mappings → Create):

**Name:** `OIDC-groups`
**Scope name:** `groups`
**Expression:**
```python
return list(request.user.ak_groups.values_list("name", flat=True))
```

Add this mapping to your provider's **Scope Mapping** list.

## 2. Create Application

In Authentik Admin → Applications → Create:

| Setting | Value |
|---------|-------|
| **Name** | `Karaoke Eternal` |
| **Slug** | `karaoke-eternal` |
| **Provider** | Select `karaoke-eternal` (created above) |
| **Launch URL** | `https://karaoke.example.com/` |

## 3. Caddy Configuration

Unlike header-based auth, OIDC uses simple reverse proxy (no `forward_auth`):

```caddyfile
karaoke.example.com {
    reverse_proxy karaoke:3000
}
```

That's it. The app handles authentication directly with Authentik via OIDC.

## 4. Environment Variables

### Required for OIDC

| Variable | Description | Example |
|----------|-------------|---------|
| `KES_OIDC_ISSUER_URL` | Authentik OIDC issuer URL | `https://auth.example.com/application/o/karaoke-eternal/` |
| `KES_OIDC_CLIENT_ID` | OAuth2 Client ID | `abc123...` |
| `KES_OIDC_CLIENT_SECRET` | OAuth2 Client Secret | `secret...` |
| `KES_PUBLIC_URL` | Public URL (for logout redirect) | `https://karaoke.example.com` |

### Role Mapping

| Variable | Default | Description |
|----------|---------|-------------|
| `KES_ADMIN_GROUP` | `admin` | Authentik group for admin role |
| `KES_GUEST_GROUP` | `karaoke-guests` | Authentik group for guest role |

### Proxy Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `KES_REQUIRE_PROXY` | Enable secure cookies | `true` |

### Guest Enrollment (Authentik API)

For guest QR enrollment, the app needs Authentik API access:

| Variable | Description |
|----------|-------------|
| `KES_AUTHENTIK_URL` | Internal API URL (e.g., `http://authentik:9000`) |
| `KES_AUTHENTIK_PUBLIC_URL` | Public URL for redirects |
| `KES_AUTHENTIK_API_TOKEN` | API token with invitation permissions |
| `KES_AUTHENTIK_ENROLLMENT_FLOW` | Flow slug (default: `karaoke-guest-enrollment`) |

## 5. Guest Enrollment Flow

Create an enrollment flow (`karaoke-guest-enrollment`) with these stages:

| Stage | Purpose |
|-------|---------|
| **Invitation** | Validates `itoken` (continue without invitation enabled) |
| **Prompt** | Captures `guest_name` (pre-filled from URL param) |
| **User Write** | Creates user with policy `set-guest-expiry-and-room` |
| **Login** | Issues session cookie |
| **Redirect** | Returns to `/` to complete room join |

### Guest Join Flow

```
Guest scans QR → /api/rooms/join/{roomId}/{itoken}
  → Redirects to /join?itoken=xxx&guest_name=RedPenguin
  → Landing page: "Login with Account" or "Join as Guest"
  → Guest clicks join → Redirect to Authentik enrollment
  → Account created → Redirect to /
  → OIDC callback → Session established → Room joined
```

See [invitation_fix_2026_01_25.md](analysis/invitation_fix_2026_01_25.md) for implementation details.

## Troubleshooting

See [troubleshooting-auth-flow.md](operations/troubleshooting-auth-flow.md) for common issues.

## Related Documentation

- [Architecture](ARCHITECTURE.md) — System overview
- [Security](SECURITY.md) — Security model
- [Guest Enrollment Details](operations/authentik-guest-enrollment.md)
