---
title: Karaoke Eternal Server
description: Documentation for Karaoke Eternal Server
---

The server hosts the web app and your media files, and can run on pretty much anything including a Raspberry Pi, NAS or Windows/Mac/Linux desktop. Since the [player]({{< ref "docs/karaoke-eternal-app#player" >}}) is fully browser-based, it doesn't need to run on the same system as the server, but it can.

## Installation

Karaoke Eternal Server is available as both a Docker image and an `npm` package. Both options are multi-platform and multi-architecture (64-bit required).

### Docker

Docker is the preferred way to run Karaoke Eternal Server if you're using a dedicated server or NAS. The [Karaoke Eternal docker image](https://hub.docker.com/r/radrootllc/karaoke-eternal) is modeled after [LinuxServer's](https://docs.linuxserver.io/general/running-our-containers) images and supports both `amd64` and `arm64`.

The easiest way to use the Docker image is via a [Compose](https://docs.docker.com/compose/) file, which is a simple YAML format for configuring your container.

Below is an example `docker compose` file:

{{< highlight yaml >}}
services:
  karaoke-eternal:
    container_name: karaoke-eternal
    image: radrootllc/karaoke-eternal
    volumes:
      # REPLACE: with the folder where the Karaoke Eternal Server database will be created
      - /path/to/database:/config
      # REPLACE: with the folder(s) containing your media
      # (inside the app, you'll add /mnt/karaoke to Media Folders)
      - /path/to/media:/mnt/karaoke
    ports:
      # optional: change the first 8080 to serve on a different port
      - 8080:8080
      # using a reverse proxy on the same machine? bind to loopback instead:
      # - 127.0.0.1:8080:8080
    # optional: set the user/group IDs to run as, and the timezone
    # environment:
    #   - PUID=1000
    #   - PGID=1000
    #   - TZ=America/New_York
    restart: unless-stopped
{{< /highlight >}}

See the [CLI & ENV]({{< ref "docs/karaoke-eternal-server#cli--env" >}}) section for additional environment settings.

Once the container is running, see [Getting Started]({{< ref "docs/getting-started" >}}) if you're new to Karaoke Eternal.

### NPM

Karaoke Eternal Server is also available as an `npm` package:

1. Install [Node.js](https://nodejs.org) v24 or later if it's not already installed.

2. In your terminal or command prompt, run the following:

{{< highlight shell >}}
npm i -g karaoke-eternal
{{< /highlight >}}

<aside class="info">
  {{% icon-info %}}
  <p>In the above command, <code>i</code> is short for "install", and <code>-g</code> means "global" so that the command in the next step will work everywhere.</p>
</aside>

3. Start the server by running:

{{< highlight shell >}}
karaoke-eternal-server
{{< /highlight >}}

<aside class="info">
  {{% icon-info %}}
  <p>The server chooses a random port at startup unless <a href="#cli--env">otherwise specified</a>. For example, to use port 8888, run <code>karaoke-eternal-server --port 8888</code></p>
</aside>

4. Look for "Web server running at..." and browse to that **server URL**.

See [Getting Started]({{< ref "docs/getting-started" >}}) if you're new to Karaoke Eternal.

## Reverse Proxy (HTTPS) {#reverse-proxy-https}

To serve the app over HTTPS (required for some features, and when exposing it over the internet) use a **reverse proxy**.

To enable **reverse proxy mode**, use the `KES_PROXY_TRUST` environment variable or the `--proxyTrust` command line option to tell Karaoke Eternal Server the address(es) from which it can expect proxied requests. Set it to a comma-separated list of any of the following:

| Value | Trusts requests from |
| --- | --- |
| `loopback` | The same machine: `127.0.0.0/8` and `::1` |
| `private` | Private/LAN ranges: `10/8`, `172.16/12`, `192.168/16`, link-local and ULA (including Docker networks) |
| `203.0.113.4` | That exact IP address |
| `203.0.113.0/24` | Any IP address in that range (CIDR) |

When the proxy runs on the same machine as Karaoke Eternal Server, use `loopback,private` if either runs in Docker, or just `loopback` if neither does. If your proxy instead connects from another machine, list its IP address or a CIDR block covering the addresses it might use. Either way, only list proxies you control.

<aside class="info">
  {{% icon-info %}}
  <p>Your proxy must set <code>X-Forwarded-Proto</code> (all of the examples below do), or its requests will be refused. Enabling <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security">HSTS</a>{{% icon-external %}} at the proxy is also recommended.</p>
</aside>

<aside class="info">
  {{% icon-info %}}
  <p>Client IPs are read from <code>X-Forwarded-For</code>, which nearly every proxy sends. If yours doesn&rsquo;t, name the header it uses instead via the <code>KES_PROXY_CLIENT_IP_HEADER</code> environment variable or the <code>--proxyClientIpHeader</code> command line option, and be sure the proxy <em>overwrites</em> that header rather than passing along whatever the client sent.</p>
</aside>

Once your reverse proxy is up and running, point your browsers to the proxy's URL instead of Karaoke Eternal Server's URL.

### Examples

<details id="caddy">
  <summary><span>Caddy</span></summary>

[Caddy](https://caddyserver.com) obtains and renews HTTPS certificates automatically, making it one of the easiest ways to serve Karaoke Eternal Server over HTTPS. Before starting the containers, point your domain's DNS at your server and make sure ports 80 and 443 are reachable from the internet (Let's Encrypt needs both to issue a certificate).

Below is an example `docker compose` file pairing Caddy with Karaoke Eternal Server in reverse-proxy mode. The `karaoke-eternal` service purposefully has no `ports:` mapping, so the app can only be reached through Caddy:

{{< highlight yaml >}}
services:
  karaoke-eternal:
    container_name: karaoke-eternal
    image: radrootllc/karaoke-eternal
    volumes:
      # REPLACE: with the folder where the Karaoke Eternal Server database will be created
      - /path/to/database:/config
      # REPLACE: with the folder(s) containing your media
      - /path/to/media:/mnt/karaoke
    environment:
      # trust Caddy running on this machine
      - KES_PROXY_TRUST=loopback,private
    restart: unless-stopped
    # if running Caddy on the host instead of via Docker, delete the caddy
    # service below and uncomment the following:
    # ports:
    #   - 127.0.0.1:8080:8080

  caddy:
    container_name: caddy
    image: caddy
    ports:
      - 80:80
      - 443:443
    volumes:
      # REPLACE: with the path to the Caddyfile
      - /path/to/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_config:/config
      - caddy_data:/data
    restart: unless-stopped

volumes:
  caddy_config:
  caddy_data:
{{< /highlight >}}

The `Caddyfile`:

{{< highlight caddyfile >}}
# REPLACE: karaoke.example.com with your domain
karaoke.example.com {
  reverse_proxy karaoke-eternal:8080
  # if running Caddy on the host instead of via Docker,
  # replace the line above with: reverse_proxy 127.0.0.1:8080
}
{{< /highlight >}}

#### Hosting at a Subpath

To host the app at a subpath such as `/karaoke`:

1. In the compose file, add `- KES_URL_PATH=/karaoke` to the `environment:` section of the `karaoke-eternal` service.
2. In the `Caddyfile`, change the `reverse_proxy` line to `reverse_proxy /karaoke* karaoke-eternal:8080`.

</details>

<details id="nginx">
  <summary><span>NGINX / Nginx Proxy Manager</span></summary>

[NGINX](https://nginx.org) serves the HTTPS certificate that [Certbot](https://certbot.eff.org) obtains and renews. Before starting the containers, point your domain's DNS at your server and make sure ports 80 and 443 are reachable from the internet (Let's Encrypt needs both to issue a certificate).

Below is an example `docker compose` file pairing NGINX with Karaoke Eternal Server in reverse-proxy mode. The `karaoke-eternal` service purposefully has no `ports:` mapping, so the app can only be reached through NGINX:

{{< highlight yaml >}}
services:
  karaoke-eternal:
    container_name: karaoke-eternal
    image: radrootllc/karaoke-eternal
    volumes:
      # REPLACE: with the folder where the Karaoke Eternal Server database will be created
      - /path/to/database:/config
      # REPLACE: with the folder(s) containing your media
      - /path/to/media:/mnt/karaoke
    environment:
      # trust NGINX running on this machine
      - KES_PROXY_TRUST=loopback,private
    restart: unless-stopped
    # if running NGINX on the host instead of via Docker, delete the nginx
    # service below and uncomment the following:
    # ports:
    #   - 127.0.0.1:8080:8080

  nginx:
    container_name: nginx
    image: nginx
    depends_on:
      - karaoke-eternal
    ports:
      - 80:80
      - 443:443
    volumes:
      # REPLACE: with the path to the nginx.conf
      - /path/to/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      # mount all of /etc/letsencrypt so the certificate symlinks resolve
      - /etc/letsencrypt:/etc/letsencrypt:ro
      # Certbot's webroot, for renewals over port 80
      - /var/www/certbot:/var/www/certbot:ro
    restart: unless-stopped
{{< /highlight >}}

The `nginx.conf`:

{{< highlight nginx >}}
# REPLACE: karaoke.example.com with your domain, everywhere below

# for the WebSocket support below
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

server {
  listen 80;
  server_name karaoke.example.com;

  # Certbot's HTTP-01 challenge, for obtaining and renewing your certificate
  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl;
  http2 on;
  server_name karaoke.example.com;
  ssl_certificate /etc/letsencrypt/live/karaoke.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/karaoke.example.com/privkey.pem;

  location / {
    proxy_pass http://karaoke-eternal:8080;
    # if running NGINX on the host instead of via Docker,
    # replace the line above with: proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    # overwrite rather than append, so a client can't claim another IP
    proxy_set_header X-Forwarded-For $remote_addr;

    # required for the player's realtime (WebSocket) connection
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}
{{< /highlight >}}

[Certbot](https://certbot.eff.org) 2.3 or later (check with `certbot --version`) can obtain your certificate and keep it renewed. Get the first certificate *before* starting the containers:

{{< highlight shell >}}
# REPLACE: karaoke.example.com with your domain
certbot certonly --standalone -d karaoke.example.com
{{< /highlight >}}

Once the containers are running, switch renewals to NGINX's webroot so they happen automatically:

{{< highlight shell >}}
# REPLACE: karaoke.example.com with your domain
certbot reconfigure --cert-name karaoke.example.com --webroot -w /var/www/certbot --deploy-hook "docker exec nginx nginx -s reload"
{{< /highlight >}}

NGINX looks up `karaoke-eternal`'s address only at startup, so whenever that container is recreated (such as after updating its image), restart NGINX too:

{{< highlight shell >}}
docker compose restart nginx
{{< /highlight >}}

If you use [Nginx Proxy Manager](https://nginxproxymanager.com), request a certificate on the proxy host's **SSL** tab, enable **Websockets Support**, and add `- KES_PROXY_CLIENT_IP_HEADER=X-Real-IP` to the `environment:` section of the `karaoke-eternal` service.

#### Hosting at a Subpath

To host the app at a subpath such as `/karaoke`:

1. In the compose file, add `- KES_URL_PATH=/karaoke` to the `environment:` section of the `karaoke-eternal` service.
2. In `nginx.conf`, change `location /` in the `listen 443` server block to `location /karaoke`.

</details>

<details id="traefik">
  <summary><span>Traefik</span></summary>

[Traefik](https://traefik.io) obtains and renews HTTPS certificates automatically. Before starting the containers, point your domain's DNS at your server and make sure ports 80 and 443 are reachable from the internet (Let's Encrypt needs both to issue a certificate).

Below is an example `docker compose` file pairing Traefik with Karaoke Eternal Server in reverse-proxy mode. The `karaoke-eternal` service purposefully has no `ports:` mapping, so the app can only be reached through Traefik:

{{< highlight yaml >}}
services:
  karaoke-eternal:
    container_name: karaoke-eternal
    image: radrootllc/karaoke-eternal
    volumes:
      # REPLACE: with the folder where the Karaoke Eternal Server database will be created
      - /path/to/database:/config
      # REPLACE: with the folder(s) containing your media
      - /path/to/media:/mnt/karaoke
    environment:
      # trust Traefik running on this machine
      - KES_PROXY_TRUST=loopback,private
    labels:
      - traefik.enable=true
      # REPLACE: karaoke.example.com with your domain
      - traefik.http.routers.karaoke.rule=Host(`karaoke.example.com`)
      - traefik.http.routers.karaoke.entrypoints=websecure
      - traefik.http.routers.karaoke.tls.certresolver=letsencrypt
      - traefik.http.services.karaoke.loadbalancer.server.port=8080
    restart: unless-stopped

  traefik:
    container_name: traefik
    image: traefik
    command:
      - --providers.docker=true
      - --providers.docker.exposedByDefault=false
      - --entryPoints.web.address=:80
      - --entryPoints.web.http.redirections.entryPoint.to=websecure
      - --entryPoints.web.http.redirections.entryPoint.scheme=https
      - --entryPoints.websecure.address=:443
      # REPLACE: with your email address (for certificate expiry notices)
      - --certificatesresolvers.letsencrypt.acme.email=you@example.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    restart: unless-stopped

volumes:
  traefik_letsencrypt:
{{< /highlight >}}

See Traefik's [certificate resolvers](https://doc.traefik.io/traefik/https/acme/) for other ways to obtain certificates automatically.

Already running Traefik? Keep only the `karaoke-eternal` service above, attach it to the network Traefik is on, and change `websecure` and `letsencrypt` in its labels to match your entrypoint and certificate resolver names.

#### Hosting at a Subpath

To host the app at a subpath such as `/karaoke`:

1. In the compose file, add `- KES_URL_PATH=/karaoke` to the `environment:` section of the `karaoke-eternal` service.
2. In the same service's `labels:` section, change the `traefik.http.routers.karaoke.rule` label to ``Host(`karaoke.example.com`) && PathPrefix(`/karaoke`)``.

</details>

<details id="cloudflare-tunnel">
  <summary><span>Cloudflare Tunnel (no port forwarding)</span></summary>

A [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) serves the app over HTTPS on your domain without opening any ports; `cloudflared` connects out to Cloudflare.

Below is an example `docker compose` file pairing `cloudflared` with Karaoke Eternal Server in reverse-proxy mode. The `karaoke-eternal` service purposefully has no `ports:` mapping, so the app can only be reached through the tunnel:

{{< highlight yaml >}}
services:
  karaoke-eternal:
    container_name: karaoke-eternal
    image: radrootllc/karaoke-eternal
    volumes:
      # REPLACE: with the folder where the Karaoke Eternal Server database will be created
      - /path/to/database:/config
      # REPLACE: with the folder(s) containing your media
      - /path/to/media:/mnt/karaoke
    environment:
      # trust cloudflared running on this machine
      - KES_PROXY_TRUST=loopback,private
    restart: unless-stopped
    # if running cloudflared on the host instead of via Docker, delete the
    # cloudflared service below and uncomment the following:
    # ports:
    #   - 127.0.0.1:8080:8080

  cloudflared:
    container_name: cloudflared
    image: cloudflare/cloudflared
    command: tunnel --no-autoupdate run
    environment:
      # REPLACE: with the token shown when creating the tunnel in the Cloudflare Zero Trust dashboard
      - TUNNEL_TOKEN=<your_tunnel_token>
    restart: unless-stopped
{{< /highlight >}}

In the [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com), create the tunnel and point its public hostname at `http://karaoke-eternal:8080` (the service name and port from the compose file).

If `cloudflared` runs on the host instead of via Docker, point the tunnel at `http://127.0.0.1:8080`.

#### Hosting at a Subpath

To host the app at a subpath such as `/karaoke`:

1. In the compose file, add `- KES_URL_PATH=/karaoke` to the `environment:` section of the `karaoke-eternal` service.
2. In the Cloudflare Zero Trust dashboard, set the public hostname's **Path** to `karaoke` and leave the service URL unchanged.

</details>

<details id="tailscale-serve">
  <summary><span>Tailscale Serve</span></summary>

If all of your devices are on a [tailnet](https://tailscale.com), [Tailscale Serve](https://tailscale.com/kb/1312/serve) provides valid HTTPS certificates with no domain, port forwarding, or separate proxy to run.

Below is an example `docker compose` file for Karaoke Eternal Server in reverse-proxy mode, with Tailscale running on the host:

{{< highlight yaml >}}
services:
  karaoke-eternal:
    container_name: karaoke-eternal
    image: radrootllc/karaoke-eternal
    volumes:
      # REPLACE: with the folder where the Karaoke Eternal Server database will be created
      - /path/to/database:/config
      # REPLACE: with the folder(s) containing your media
      - /path/to/media:/mnt/karaoke
    environment:
      # trust Tailscale running on this machine
      - KES_PROXY_TRUST=loopback,private
    ports:
      # bind to loopback so the app can only be reached through Tailscale
      - 127.0.0.1:8080:8080
    restart: unless-stopped
{{< /highlight >}}

Enable **MagicDNS** and **HTTPS Certificates** in the Tailscale admin console, then on the machine running Karaoke Eternal Server:

{{< highlight shell >}}
tailscale serve --bg 8080
{{< /highlight >}}

Devices then use `https://<machine-name>.<tailnet-name>.ts.net` — every device must be logged into the tailnet.

#### Hosting at a Subpath

Tailscale Serve can't host the app at a subpath; use one of the other reverse proxies above.

</details>

## Media Files

The following file types are supported:

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) (including zipped; also supports .m4a instead of .mp3)
- MP4 video (codec support can vary depending on the browser running the [player]({{< ref "docs/karaoke-eternal-app#player" >}}))

Karaoke Eternal Server expects your media files to be named in **"Artist - Title"** format by default (you can [configure this](#metadata-parser)). Media with filenames that couldn't be parsed won't appear in the library, so check the [scanner log](#file-locations) or console output for these.

## Metadata Parser

You can customize the metadata parser by creating a file named `_kes.v2.json` in a media folder. It will apply to all media files in the folder, including subfolders. If any subfolders contain their own `_kes.v2.json` file, that will take precedence instead. These files can be in JSON or JSON5 format — the examples below use JSON5.

### Basic Configuration

Your `_kes.v2.json` file can override any of these defaults:

{{< highlight js >}}
{
  // used to normalize artist/title; set false to disable
  articles: ['A', 'An', 'The'],

  // assumes filenames are in "Artist - Title" format
  artistOnLeft: true,

  // assumes a hyphen separates the artist and title
  delimiter: '-',
}
{{< /highlight >}}

For example, if you had a folder with filenames in the format "Title - Artist" instead, you could create this `_kes.v2.json` file in it:

{{< highlight js >}}
{
  artistOnLeft: false, // override default
}
{{< /highlight >}}

### Advanced Templating

If changing the parser's default configuration doesn't yield the desired results, you can also define your own "template" to override the result for one or more of these fields:

- `artist` (string) artist's name as it will be shown in the library
- `artistNorm` (string) normalized version of the artist's name; used for matching and sorting (normalized from your `artist` if not set)
- `title` (string) song's title as it will be shown in the library
- `titleNorm` (string) normalized version of the song's title; used for matching and sorting (normalized from your `title` if not set)

For each media file encountered, Karaoke Eternal makes a "context" available to your field template(s). This context includes the fields above (that is, the results from the built-in parser) in addition to:

- `name` (string) media filename (without extension)
- `meta` (object) media file's [metadata fields](https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md)
- `dir` (string) full path of the containing folder
- `dirSep` (string) path separator used by the current OS (`/` or `\`)

Field templates are defined using [JSON-e syntax](https://json-e.js.org). In addition to JSON-e's [built-in methods](https://json-e.js.org/built-ins.html), a `replace` method is also provided for simple text replacement. Here are a few examples of how one might use field templates in their `_kes.v2.json` file:

{{< highlight js >}}
// explicitly set the artist field
{
  artist: "My Artist's Name",
}
{{< /highlight >}}

{{< highlight js >}}
// remove "junk" from anywhere in the parsed artist field
{
  artist: {
    $eval: 'replace(artist, "junk", "")'
  },
}
{{< /highlight >}}

{{< highlight js >}}
// remove "junk" case-insensitively from the start of the parsed artist field (regex syntax)
// note: double backslash escapes to a single backslash
{
  artist: {
    $eval: 'replace(artist, "^junk\\s", "i", "")'
  },
}
{{< /highlight >}}

{{< highlight js >}}
// set artist and title using the media file's metadata tags
{
  artist: '${meta.artist}',
  title: '${meta.title}',
}
{{< /highlight >}}

<aside class="info">
  {{% icon-info %}}
  <p><strong>Tip: </strong>Setting the media scanner log or console level to "debug" (see below) can be helpful in troubleshooting your field templates.
</p>
</aside>

## CLI & ENV

Karaoke Eternal Server supports the following CLI options and environment variables. The numeric values used for log/console levels are: **0**=off, **1**=error, **2**=warn, **3**=info, **4**=verbose, **5**=debug

| Option | ENV | Description | Default |
| --- | --- | --- | --- |
| `--data <string>`| `KES_PATH_DATA` | Absolute path of folder for database files | [varies](#file-locations) |
| `-p, --port <number>`| `KES_PORT` | Web server port | auto |
| `--proxyClientIpHeader <string>`| `KES_PROXY_CLIENT_IP_HEADER` | Header holding the real client IP, for proxies that don't send `X-Forwarded-For`; honored only from a trusted proxy ([details](#reverse-proxy-https)) | |
| `--proxyTrust <string>`| `KES_PROXY_TRUST` | Proxy IPs/CIDRs (or presets `loopback`, `private`) to trust `X-Forwarded-*` from; enables reverse-proxy mode ([details](#reverse-proxy-https)) | |
| `--rotateKey`| `KES_ROTATE_KEY` | Rotate the session key at startup | |
| `--scan`| `KES_SCAN` | Run the media scanner at startup. Accepts a comma-separated list of pathIds, "all", and/or "full" (also scans unchanged files) | |
| `--scannerConsoleLevel <number>`| `KES_SCANNER_CONSOLE_LEVEL` | Media scanner console output level | 4 |
| `--scannerLogLevel <number>`| `KES_SCANNER_LOG_LEVEL` | Media scanner log file level | 3 |
| `--serverConsoleLevel <number>`| `KES_SERVER_CONSOLE_LEVEL` | Web server console output level | 4 |
| `--serverLogLevel <number>`| `KES_SERVER_LOG_LEVEL` | Web server log file level | 3 |
| `--urlPath <string>`| `KES_URL_PATH` | Web server base URL path (must begin with a forward slash) | / |
| `-v, --version`| | Show version and exit | |

## File Locations

If using the Docker image, the database will be located in the folder you mapped to the container's `/config` folder. The container doesn't write log files by default; use the [Docker logs](https://docs.docker.com/reference/cli/docker/container/logs/) command instead to see the container's output.

If using the `npm` installation method, the default locations for the database (`database.sqlite3`), web server log (`server.log`) and media scanner log (`scanner.log`) are as follows:

### Windows

- Database: `%USERPROFILE%\AppData\Roaming\Karaoke Eternal Server`
- Logs: `%USERPROFILE%\AppData\Roaming\Karaoke Eternal Server\logs`

### macOS

- Database: `~/Library/Application Support/Karaoke Eternal Server`
- Logs: `~/Library/Logs/Karaoke Eternal Server`

### Linux

- Database: `~/.config/Karaoke Eternal Server`
- Logs: `~/.config/Karaoke Eternal Server/logs`
