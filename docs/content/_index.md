---
title: Overview
---

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's web browser. The player is also browser-based with support for [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> and MP4 video files. The server runs on your local network (see <a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>Karaoke Forever Server</a>) with no internet connection required.

Karaoke Forever basically has 3 parts:

- **<a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>Server:</a>** Runs on Mac/Windows/Linux/etc. to serve the app and media files on your local network.

- **<a href='{{< ref "docs/index.md/#karaoke-forever-the-web-app" >}}'>Mobile browser app:</a>** Everyone can join in without having to install anything on their phones.

- **<a href='{{< ref "docs/index.md/#player-admin-only" >}}'>Player:</a>** Just another part of the browser app, but designed to run in fullscreen mode on the system handling audio and video for a [room](https://www.karaoke-forever.com/docs/#rooms-admin-only).

<figure>
  <video src="{{% baseurl %}}static/karaoke-forever-demo1-540p.mp4" id="video1" controls muted></video>
  <figcaption>App running in Mobile Safari (left) and Firefox/Chrome/Edge (right)</figcaption>
</figure>

## Features

- Modern browser-based app and player with dark UI designed for "karaoke conditions"
- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> and MP4 video file support
- Milkdrop visualizations via [Butterchurn](https://github.com/jberg/butterchurn)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> (requires [WebGL 2](https://caniuse.com/#feat=webgl2)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>)
- Prioritizes singers based on the amount of time since each last sang
- Multiple simultaneous rooms/queues/players
- No telemetry; all data stored locally

<br>
Karaoke Forever assumes its player will be mixed with any microphones (either in software or an outboard mixer). See the <a href='{{< ref "/faq.md#what-s-the-recommended-microphone-audio-setup" >}}'>F.A.Q.</a> for more information.

## Download

The <a href="{{% baseurl %}}download">Releases page</a><svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> has the latest packaged versions of <a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>Karaoke Forever Server</a> for macOS and Windows.

## Documentation

Please see <a href='{{< ref "docs/index.md/#quick-start" >}}'>Quick Start</a> to get started, or jump to the documentation for <a href='{{< ref "docs/index.md/#karaoke-forever-the-web-app" >}}'>Karaoke Forever</a> (the "web" app) or <a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>Karaoke Forever Server</a>.

## Discord / Support

Join the [Karaoke Forever Discord Server](https://discord.gg/PgqVtFq)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> for general support and development chat, or just to say hi!

## Contributing & Development

See the <a href="{{% baseurl %}}repo">GitHub project page</a><svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>.
