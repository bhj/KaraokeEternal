---
title: How do I run Karaoke Eternal Server behind a reverse proxy?
weight: 11
---

To enable reverse-proxy mode, use either:

- the `KES_PROXY_TRUST` environment variable
- the `--proxyTrust` command line option

Set it to your proxy's address(es), then connect all devices via the proxy's URL. See <a href='{{< ref "docs/karaoke-eternal-server#reverse-proxy-https" >}}'>Reverse Proxy (HTTPS)</a> for accepted values and example configurations.
