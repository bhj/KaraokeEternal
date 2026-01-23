# Caddy Configuration: Smart QR Bypass

To enable the "Smart QR" feature (allowing both guests and logged-in users to join rooms via a single QR code), you must configure Caddy to **bypass authentication** for the specific join endpoint.

This allows the Karaoke App to handle the routing logic ("Join Room" vs "Redirect to Enrollment") instead of Authentik blocking the request immediately.

## The Configuration

Add the `@smart_join` matcher and `handle` block **BEFORE** your main authentication block.

### Caddyfile Example

```caddy
karaoke.yourdomain.com {
    
    # --- 1. The Bypass (Public Join Endpoint) ---
    # Allow requests to the join endpoint to reach the app directly.
    # The App will check for a session cookie:
    # - If Logged In: Joins the room immediately.
    # - If Guest: Manually redirects the browser to Authentik Enrollment.
    @smart_join path /api/rooms/join/*
    handle @smart_join {
        reverse_proxy localhost:8280
    }

    # --- 2. The Gatekeeper (Everything Else) ---
    # All other traffic MUST be authenticated by Authentik.
    handle {
        forward_auth localhost:9000 {
            uri /outpost.goauthentik.io/auth/caddy
            copy_headers X-Authentik-Username X-Authentik-Groups X-Authentik-Email X-Authentik-Name X-Authentik-Uid X-Authentik-Karaoke-Room-Id
            trusted_proxies private_ranges
        }
        reverse_proxy localhost:8280
    }
}
```

## NixOS Configuration (caddy.nix)

If you are using NixOS, update your Caddy virtual host config:

```nix
virtualHosts."karaoke.thedb.club" = {
  extraConfig = ''
    # Bypass Auth for Smart QR
    @smart_join path /api/rooms/join/*
    handle @smart_join {
      reverse_proxy localhost:8280
    }

    # Default Authenticated Route
    handle {
      forward_auth localhost:9000 {
        uri /outpost.goauthentik.io/auth/caddy
        copy_headers X-Authentik-Username X-Authentik-Groups X-Authentik-Email X-Authentik-Name X-Authentik-Uid X-Authentik-Karaoke-Room-Id
        trusted_proxies private_ranges
      }
      reverse_proxy localhost:8280
    }
  '';
};
```

## Security Note
This exposes **only** the `/api/rooms/join/*` endpoint to the public. 
*   This endpoint is read-only.
*   It validates the Invitation UUID before performing any action.
*   It does not expose user data.
