# Caddy Configuration for Karaoke Hydra

With app-managed OIDC, Caddy configuration is simple: just reverse proxy all traffic to the app. The app handles authentication internally.

## The Configuration

### Caddyfile Example

```caddy
karaoke.yourdomain.com {
    encode gzip zstd

    # WebSocket support for Socket.IO
    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket localhost:8280 {
        flush_interval -1
        transport http {
            versions 1.1
        }
    }

    # All requests go directly to app (app handles auth)
    reverse_proxy localhost:8280 {
        header_up X-Real-IP {client_ip}
        flush_interval -1
    }
}
```

### NixOS Configuration (caddy.nix)

```nix
virtualHosts."karaoke.thedb.club" = {
  extraConfig = ''
    encode gzip zstd

    # WebSocket support for Socket.IO
    @websocket {
      header Connection *Upgrade*
      header Upgrade websocket
    }
    reverse_proxy @websocket localhost:8280 {
      flush_interval -1
      transport http {
        versions 1.1
      }
    }

    # All requests go directly to app (app handles auth)
    reverse_proxy localhost:8280 {
      header_up X-Real-IP {client_ip}
      flush_interval -1
    }
  '';
};
```

## What Changed from Proxy Auth

Previously, Caddy used `forward_auth` to authenticate requests via Authentik's Proxy Provider. This required:
- Multiple bypass rules for unauthenticated endpoints
- `copy_headers` directives for `X-Authentik-*` headers
- Complex path matching for static assets, APIs, etc.

With app-managed OIDC, none of this is needed. The app:
- Redirects unauthenticated users to `/api/auth/login`
- Handles the OIDC callback at `/api/auth/callback`
- Issues its own JWT session cookie

## Verification

```bash
# App should return 401 for unauthenticated API requests
curl -s -w "%{http_code}" https://karaoke.example.com/api/user
# Expected: 401

# Login endpoint should redirect to Authentik
curl -I https://karaoke.example.com/api/auth/login
# Expected: 302 with Location header pointing to Authentik

# Public prefs should return JSON
curl https://karaoke.example.com/api/prefs/public | jq
# Expected: {"ssoLoginUrl":"/api/auth/login",...}
```
