---
title: How do I host the app at a URL subpath?
weight: 15
---

To host Karaoke Eternal Server at the `/karaoke` subpath (for example), use either:

- the `KES_URL_PATH=/karaoke` environment variable
- the `--urlPath /karaoke` command line option

See <a href='{{< ref "docs/karaoke-eternal-server#cli--env" >}}'>CLI & ENV</a> for details.

If you're using a reverse proxy, have it forward the same path without stripping it. See the examples in <a href='{{< ref "docs/karaoke-eternal-server#reverse-proxy-https" >}}'>Reverse Proxy (HTTPS)</a>.
