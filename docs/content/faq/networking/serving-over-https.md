---
title: How do I serve the app over HTTPS?
weight: 10
---

Karaoke Eternal Server speaks plain HTTP; to serve the app over HTTPS (required for pitch shifting), run it behind a reverse proxy that terminates TLS. See <a href='{{< ref "docs/karaoke-eternal-server#reverse-proxy-https" >}}'>Reverse Proxy (HTTPS)</a> for setup and example configurations (Caddy, NGINX, Traefik, Cloudflare Tunnel and Tailscale).
