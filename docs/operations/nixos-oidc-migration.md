# NixOS + Authentik OIDC Migration

This guide migrates from Caddy `forward_auth` to app-managed OIDC.

## Step 1: Create Authentik OAuth2 Provider

In Authentik Admin → Applications → Providers → Create:

1. **Name**: `karaoke-eternal-oidc`
2. **Authorization flow**: `default-authorization-flow`
3. **Client type**: `Confidential`
4. **Client ID**: (auto-generated, copy this)
5. **Client Secret**: (auto-generated, copy this)
6. **Redirect URIs**: `https://karaoke.thedb.club/api/auth/callback`
7. **Scopes**: `openid`, `profile`, `email`, `groups` (or add custom scope)
8. **Subject mode**: `Based on User's username`

Then create an Application:
- **Name**: `Karaoke Eternal`
- **Slug**: `karaoke-eternal`
- **Provider**: `karaoke-eternal-oidc`

## Step 2: Add OIDC secrets to sops

Add to `secrets/thedb-server.yaml`:

```yaml
karaoke-oidc-secrets: |
  KES_OIDC_CLIENT_ID=<client-id-from-authentik>
  KES_OIDC_CLIENT_SECRET=<client-secret-from-authentik>
```

## Step 3: Update karaoke-eternal.nix

```nix
{ config, pkgs, lib, inputs, ... }:

let
  karaoke-eternal = pkgs.buildNpmPackage rec {
    pname = "karaoke-eternal-automated";
    version = "unstable-2026-01-25";

    src = inputs.karaoke-eternal;

    nodejs = pkgs.nodejs_24;
    npmDepsHash = "sha256-XXXXX"; # Update after npm changes

    nativeBuildInputs = with pkgs; [ python3 gnumake gcc ];

    buildPhase = ''
      runHook preBuild
      npm run build
      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall
      mkdir -p $out/{bin,lib/karaoke-eternal}
      cp -r build assets package.json node_modules $out/lib/karaoke-eternal/

      cat > $out/bin/karaoke-eternal << EOF
      #!${pkgs.bash}/bin/bash
      exec ${pkgs.nodejs_24}/bin/node $out/lib/karaoke-eternal/build/server/main.js "\$@"
      EOF
      chmod +x $out/bin/karaoke-eternal
      runHook postInstall
    '';

    meta = with lib; {
      description = "Karaoke Eternal with app-managed OIDC";
      homepage = "https://github.com/Zardoz8901/KaraokeEternalAutomated";
      license = licenses.isc;
    };
  };
in
{
  # --- SECRETS ---
  sops.secrets.karaoke-oidc-secrets = {
    sopsFile = ../../../secrets/thedb-server.yaml;
    owner = "karaoke-eternal";
    mode = "0400";
  };

  # --- SERVICE ---
  systemd.services.karaoke-eternal = {
    description = "Karaoke Eternal Server";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];

    environment = {
      NODE_ENV = "production";
      KES_PORT = "8280";
      KES_PATH_DATA = "/apps/karaoke-eternal";
      KES_PATH_MEDIA = "/media/karaoke";

      # --- OIDC Configuration (NEW) ---
      KES_OIDC_ISSUER_URL = "https://auth.thedb.club/application/o/karaoke-eternal/";
      # KES_OIDC_CLIENT_ID and KES_OIDC_CLIENT_SECRET loaded from secrets file

      # Admin/Guest group names (must match Authentik groups)
      KES_ADMIN_GROUP = "karaoke-admin";
      KES_GUEST_GROUP = "karaoke-guests";

      # Ephemeral rooms
      KES_EPHEMERAL_ROOMS = "true";
      KES_ROOM_IDLE_TIMEOUT = "240";

      # Proxy security
      KES_REQUIRE_PROXY = "true";
      KES_TRUSTED_PROXIES = "127.0.0.1,::1";
      KES_TRUST_PROXY = "true";

      # Public URLs (for QR codes)
      KES_AUTHENTIK_PUBLIC_URL = "https://auth.thedb.club";
      KES_AUTHENTIK_ENROLLMENT_FLOW = "karaoke-guest-enrollment";

      # --- LEGACY (can remove after verification) ---
      # KES_AUTH_HEADER = "X-Authentik-Username";
      # KES_GROUPS_HEADER = "X-Authentik-Groups";
      # KES_ROOM_ID_HEADER = "X-Authentik-Karaoke-Room-Id";
      # KES_SSO_SIGNOUT_URL = "https://auth.thedb.club/flows/-/default/invalidation/";
    };

    serviceConfig = {
      Type = "simple";
      User = "karaoke-eternal";
      Group = "karaoke";
      ExecStart = "${karaoke-eternal}/bin/karaoke-eternal";
      EnvironmentFile = config.sops.secrets.karaoke-oidc-secrets.path;
      Restart = "always";
      RestartSec = "5s";

      NoNewPrivileges = true;
      ProtectSystem = "strict";
      ProtectHome = true;
      PrivateTmp = true;
      ReadWritePaths = [ "/apps/karaoke-eternal" ];
      ReadOnlyPaths = [ "/media/karaoke" ];
    };
  };

  users.users.karaoke-eternal = {
    isSystemUser = true;
    group = "karaoke";
    home = "/apps/karaoke-eternal";
    createHome = true;
  };

  systemd.tmpfiles.rules = [
    "d /apps/karaoke-eternal 0750 karaoke-eternal karaoke -"
  ];
}
```

## Step 4: Simplify caddy.nix

Replace the karaoke.thedb.club virtual host with:

```nix
# --- KARAOKE (App-managed OIDC - no forward_auth) ---
"karaoke.thedb.club" = {
  extraConfig = ''
    encode gzip zstd
    ${securityHeaders}

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

That's it! No more:
- `forward_auth` blocks
- Static asset bypasses
- Landing page bypasses
- API bypasses
- Socket.IO bypasses

## Step 5: Deploy

```bash
# Rebuild and switch
sudo nixos-rebuild switch --flake .#thedb-server

# Verify app starts
journalctl -u karaoke-eternal -f
```

## Step 6: Test

```bash
# Should redirect to Authentik login
curl -I https://karaoke.thedb.club/api/auth/login

# Should return 401 (not HTML redirect)
curl -s -w "%{http_code}" https://karaoke.thedb.club/api/user

# Public prefs should show ssoLoginUrl: "/api/auth/login"
curl https://karaoke.thedb.club/api/prefs/public | jq
```

## Rollback

If issues occur, check the app logs for OIDC configuration errors. Common issues:
- Invalid client credentials
- Incorrect issuer URL
- Missing redirect URI in Authentik
