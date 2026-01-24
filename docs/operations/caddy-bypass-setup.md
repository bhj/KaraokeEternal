# Caddy Configuration: Authentication Bypass

To enable the guest enrollment flow (allowing both guests and logged-in users to join rooms via a single QR code), you must configure Caddy to **bypass authentication** for:

1. **Static Assets** (`*.js`, `*.css`, etc.) - Required for the app to load at all
2. **Landing Page** (`/join*`) - The UI where users choose to login or join as guest
3. **Smart QR API** (`/api/rooms/join/*`) - The endpoint that validates invitation tokens
4. **Public Prefs API** (`/api/prefs/public`) - Returns public configuration needed by the landing page
5. **Session Check API** (`/api/user`) - Returns current user or 401 (app handles auth state properly)
6. **Enrollment API** (`/api/rooms/*/enrollment`) - Returns SSO enrollment URL for guest flow

This allows the Karaoke App to handle the routing logic instead of Authentik blocking the request immediately.

## The Configuration

Add the bypass matchers and handle blocks **BEFORE** your main authentication block. Order matters in Caddy - first match wins.

### Caddyfile Example

```caddy
karaoke.yourdomain.com {

    # --- 1. Bypass: Static Assets ---
    # JS, CSS, and other static files must load without authentication.
    # Without this, the React app cannot load on any bypassed page.
    @static path *.js *.css *.map *.ico *.png *.jpg *.jpeg *.gif *.svg *.woff *.woff2 *.ttf *.eot
    handle @static {
        reverse_proxy localhost:8280
    }

    # --- 2. Bypass: Landing Page (unauthenticated access) ---
    # The join landing page must be accessible before login.
    # Shows room name, offers "Login with Account" or "Join as Guest" options.
    @landing_page path /join*
    handle @landing_page {
        reverse_proxy localhost:8280
    }

    # --- 3. Bypass: Smart QR API ---
    # Allow the join endpoint to reach the app directly.
    # The App will check for a session cookie:
    # - If Logged In: Joins the room immediately.
    # - If Guest: Redirects to Authentik Enrollment.
    @smart_join path /api/rooms/join/*
    handle @smart_join {
        reverse_proxy localhost:8280
    }

    # --- 4. Bypass: Public Prefs API ---
    # Returns public configuration (Authentik URL, SSO mode, etc.)
    # Needed by the landing page to display login/enrollment options.
    @public_prefs path /api/prefs/public
    handle @public_prefs {
        reverse_proxy localhost:8280
    }

    # --- 5. Bypass: Session Check API ---
    # Returns current user session or 401. App handles auth state properly.
    # Must bypass forward_auth to avoid HTML redirect on unauthenticated requests.
    @session_check path /api/user
    handle @session_check {
        reverse_proxy localhost:8280
    }

    # --- 6. Bypass: Enrollment API ---
    # Returns the SSO enrollment URL for guests scanning QR codes.
    # Called by App.tsx before user is authenticated.
    @enrollment path /api/rooms/*/enrollment
    handle @enrollment {
        reverse_proxy localhost:8280
    }

    # --- 7. Gatekeeper (Everything Else) ---
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
    # Bypass: Static Assets (required for React app to load)
    @static path *.js *.css *.map *.ico *.png *.jpg *.jpeg *.gif *.svg *.woff *.woff2 *.ttf *.eot
    handle @static {
      reverse_proxy localhost:8280
    }

    # Bypass: Landing Page
    @landing_page path /join*
    handle @landing_page {
      reverse_proxy localhost:8280
    }

    # Bypass: Smart QR API
    @smart_join path /api/rooms/join/*
    handle @smart_join {
      reverse_proxy localhost:8280
    }

    # Bypass: Public Prefs API
    @public_prefs path /api/prefs/public
    handle @public_prefs {
      reverse_proxy localhost:8280
    }

    # Bypass: Session Check API
    @session_check path /api/user
    handle @session_check {
      reverse_proxy localhost:8280
    }

    # Bypass: Enrollment API
    @enrollment path /api/rooms/*/enrollment
    handle @enrollment {
      reverse_proxy localhost:8280
    }

    # Gatekeeper: Authenticated Route
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

## Security Notes

### Static Assets (`*.js`, `*.css`, etc.)
- Contains only bundled frontend code (no secrets)
- Required for the React app to load on ANY page
- Without this bypass, users see a white screen on bypassed routes
- The app server handles these files directly

### `/join*` (Landing Page)
- Exposes only the join UI - displays room name from the invitation token
- No sensitive data - just a preview of what room you're joining
- The actual join action requires authentication

### `/api/rooms/join/*` (Smart QR API)
- Read-only endpoint that validates invitation tokens
- For authenticated users: joins the room and sets cookie
- For unauthenticated users: returns redirect URL to Authentik enrollment
- Does not expose user data

### `/api/prefs/public` (Public Prefs API)
- Read-only endpoint returning public configuration
- Returns: `authentikUrl`, `enrollmentFlow`, `ssoMode`, `ssoLoginUrl`
- No sensitive data - just URLs and feature flags needed by the landing page

### `/api/user` (Session Check API)
- Read-only endpoint checking authentication state
- Returns current user object if authenticated (cookie present)
- Returns 401 if not authenticated
- Must bypass forward_auth because Authentik returns HTML redirect instead of 401 for unauthenticated API requests, causing client-side state corruption

### `/api/rooms/*/enrollment` (Enrollment API)
- Read-only endpoint returning the SSO enrollment URL for a room
- Called by the app before user authentication to get the guest enrollment redirect URL
- Returns `{ enrollmentUrl: "..." }` if room has invitation token, or `{ enrollmentUrl: null }` otherwise
- Does not expose sensitive data - just constructs a URL from public configuration

## Verification

Test that bypasses work correctly:

```bash
# CRITICAL: Static assets must return 200 (not redirect to Authentik)
# Get the JS filename from the HTML first
curl -s https://karaoke.example.com/join | grep -oP 'main\.[a-f0-9]+\.js'
# Then test it directly:
curl -I https://karaoke.example.com/main.HASH.js
# Expected: HTTP/2 200 (not 302 redirect!)
# If you see 302 → Authentik, the static bypass is missing!

# Landing page should return 200 (not redirect to Authentik)
curl -I https://karaoke.example.com/join?itoken=test
# Expected: HTTP/2 200

# Smart QR API should return JSON (not redirect to Authentik)
curl https://karaoke.example.com/api/rooms/join/1/test-token
# Expected: JSON response (error is fine, just not HTML redirect)

# Public prefs should return JSON (not redirect to Authentik)
curl https://karaoke.example.com/api/prefs/public
# Expected: {"authentikUrl":"...","enrollmentFlow":"...","ssoMode":true,...}

# Session check should return 401 (not HTML redirect)
curl -s -w "%{http_code}" https://karaoke.example.com/api/user
# Expected: 401 (not 200 with HTML body)

# Enrollment API should return JSON (not redirect to Authentik)
curl https://karaoke.example.com/api/rooms/1/enrollment
# Expected: {"enrollmentUrl":"..."} or {"enrollmentUrl":null}

# Other routes should redirect to Authentik
curl -I https://karaoke.example.com/library
# Expected: HTTP/2 302 or 401 (redirect to Authentik)
```
