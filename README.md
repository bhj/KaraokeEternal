# Karaoke Eternal Automated

Fork of [Karaoke Eternal](https://github.com/bhj/KaraokeEternal) with Authentik SSO integration and ephemeral rooms for automated multi-user deployments.

## Fork Features

This fork adds:

- **Header-based SSO**: Reads `X-Authentik-Username` header for automatic authentication (no login page)
- **Ephemeral Rooms**: Auto-creates a personal room per user on login
- **Auto Cleanup**: Rooms are automatically destroyed when empty or after 4 hours idle
- **NixOS Support**: Includes `flake.nix` with devshell for development

These features are designed for deployments behind a reverse proxy (Caddy, nginx, Traefik) with Authentik forward auth.

## Upstream Features

All upstream Karaoke Eternal features are preserved:

- MP3+G (CDG) and MP4 video playback
- Mobile-friendly web app for song search and queue management
- WebGL visualizations with automatic lyrics background removal
- Self-hosted with no ads or telemetry

See the [upstream documentation](https://www.karaoke-eternal.com/docs/) for general usage.

## Deployment

### NixOS

Add to your NixOS configuration:

```nix
# In your flake.nix inputs:
karaoke-eternal.url = "github:Zardoz8901/KaraokeEternalAutomated";

# In your configuration:
services.karaoke-eternal = {
  enable = true;
  port = 8280;
  dataDir = "/apps/karaoke-eternal";
  mediaPath = "/media/karaoke";
};
```

### Docker

```bash
docker build -t karaoke-eternal-automated .
docker-compose up -d
```

See `docker-compose.yml` for configuration options.

### Development

```bash
# Enter development shell (requires Nix with flakes)
nix develop

# Or manually with Node.js 24+
npm install
npm run dev     # Start dev server (port 3000)
npm run build   # Build for production
npm run test    # Run tests
npm run lint    # Run linter
```

## Configuration

### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `KES_PORT` | 3000 | Server port |
| `KES_PATH_DATA` | Platform-specific | Database and config location |
| `KES_PATH_MEDIA` | - | Media library path |

### SSO Header Auth

| Variable | Default | Description |
|----------|---------|-------------|
| `KES_AUTH_HEADER` | `X-Authentik-Username` | Header containing username |
| `KES_GROUPS_HEADER` | `X-Authentik-Groups` | Header containing groups (pipe-separated) |
| `KES_ADMIN_GROUP` | `admin` | Group name that grants admin privileges |
| `KES_GUEST_GROUP` | `karaoke-guests` | Group name for guest users |
| `KES_ROOM_ID_HEADER` | `X-Authentik-Karaoke-Room-Id` | Header for guest room assignment |
| `KES_EPHEMERAL_ROOMS` | `true` | Enable auto-create rooms per user |
| `KES_ROOM_IDLE_TIMEOUT` | `240` | Minutes before idle room cleanup |

### Authentik Guest Invitations

| Variable | Default | Description |
|----------|---------|-------------|
| `KES_AUTHENTIK_URL` | - | Internal Authentik URL for API calls |
| `KES_AUTHENTIK_API_TOKEN` | - | Authentik API token |
| `KES_AUTHENTIK_PUBLIC_URL` | - | External Authentik URL for QR codes |
| `KES_AUTHENTIK_ENROLLMENT_FLOW` | `karaoke-guest-enrollment` | Enrollment flow slug |

### Proxy Security

| Variable | Default | Description |
|----------|---------|-------------|
| `KES_REQUIRE_PROXY` | `true` (prod), `false` (dev) | Reject requests not from trusted proxy |
| `KES_TRUSTED_PROXIES` | _(empty)_ | Comma-separated IPs/CIDRs (e.g., `10.0.0.1,192.168.0.0/16`) |

When `KES_REQUIRE_PROXY=true`, only requests from loopback addresses (`127.0.0.1`, `::1`) or IPs matching `KES_TRUSTED_PROXIES` are allowed. This prevents attackers from bypassing authentication by accessing the server directly.

**Important**: When proxy enforcement is enabled, configure `KES_TRUSTED_PROXIES` to match your reverse proxy's IP address.

### Admin Role Behavior

Admin privileges are **strictly synced** with the SSO groups header on every request:
- If a user is in the admin group, they become admin
- If a user is removed from the admin group, they are **demoted** to standard user
- This ensures SSO is the source of truth for access control

## Authentik Integration

This fork is designed to work with [Authentik](https://goauthentik.io/) forward auth.

### Authentik Setup

1. **Create Application**
   - Go to Applications > Applications > Create
   - Name: `Karaoke Eternal`
   - Slug: `karaoke-eternal`
   - Provider: (create in next step)

2. **Create Forward Auth Provider**
   - Go to Applications > Providers > Create
   - Type: `Proxy Provider`
   - Name: `karaoke-eternal-provider`
   - Authorization flow: Select your default
   - Mode: `Forward auth (single application)`
   - External host: `https://karaoke.yourdomain.com`

3. **Create Outpost** (if not already exists)
   - Go to Applications > Outposts
   - Create or use existing `authentik Embedded Outpost`
   - Ensure the Karaoke Eternal application is selected

### Reverse Proxy (Caddy)

```caddyfile
karaoke.yourdomain.com {
    # Proxy outpost endpoints
    reverse_proxy /outpost.goauthentik.io/* localhost:9000

    # Forward auth
    forward_auth localhost:9000 {
        uri /outpost.goauthentik.io/auth/caddy
        copy_headers X-Authentik-Username X-Authentik-Groups X-Authentik-Email X-Authentik-Name X-Authentik-Uid X-Authentik-Karaoke-Room-Id
        trusted_proxies private_ranges
    }

    # WebSocket support for Socket.IO
    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket localhost:8280
    reverse_proxy localhost:8280
}
```

### How It Works

1. User visits `karaoke.yourdomain.com`
2. Caddy's `forward_auth` checks with Authentik
3. If not logged in, user is redirected to Authentik login
4. After login, Authentik adds `X-Authentik-Username` header
5. Karaoke Eternal reads the header and sets a session cookie
6. On page load, the app automatically checks for an existing session
7. User lands directly in their room - **no login UI ever shown**
8. Admin privileges sync automatically based on Authentik groups

### Guest Invitations

Guests can join rooms via QR code without needing existing Authentik accounts:

1. **Host opens Player** - QR code displays with Authentik enrollment URL
2. **Guest scans QR** - Lands on Authentik enrollment page
3. **Guest enters display name** - Authentik creates account in `karaoke-guests` group
4. **Guest is redirected** - Automatically joined to host's room via `X-Authentik-Karaoke-Room-Id` header

**Authentik Setup for Guest Invitations:**

1. Create `karaoke-guests` group (bind only to karaoke app)
2. Create enrollment flow `karaoke-guest-enrollment`:
   - **Invitation Stage**: Require `itoken` parameter
   - **Prompt Stage**: Display name only (auto-generate username)
   - **User Write Stage**: Add to `karaoke-guests` group, copy `karaoke_room_id` from invitation to user attributes
   - **Redirect Stage**: Use `?next` URL parameter
3. Create API token with permissions: `flows.instances` (read), `stages.invitation.invitations` (create, delete, list), `core.users` (list, delete)
4. Configure proxy outpost to pass `X-Authentik-Karaoke-Room-Id` header: `{{ user.attributes.karaoke_room_id|default('') }}`

**Guest Cleanup:**
- When an admin explicitly deletes a room, Authentik invitations and guest accounts for that room are automatically deleted
- Idle room cleanup does NOT delete Authentik accounts (prevents accidental data loss)

## Database Migrations

This fork adds migration `006-ephemeral-rooms.sql` which adds:
- `isEphemeral` column to rooms table
- `roomCreatedAt` column for cleanup tracking

Migrations run automatically on server start.

## License

ISC (same as upstream)

## Credits

- Upstream: [Karaoke Eternal](https://github.com/bhj/KaraokeEternal) by bhj
- Fork: Authentik integration and ephemeral rooms by Zardoz8901
