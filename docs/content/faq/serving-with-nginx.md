---
title: Karaoke Eternal Server with NGINX (reverse proxy + custom path)
category: Networking
weight: 4
---

If you want to host the app at `/karaoke` for example, run Karaoke Eternal Server with the `--urlPath /karaoke` option, then use an NGINX config similar to the following, replacing `<your_server_ip>` and `<your_server_port>`:

```
  location /karaoke {
    proxy_pass http://192.168.1.11:8090/karaoke;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Proto $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}
```
