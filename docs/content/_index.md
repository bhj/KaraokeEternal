---
title: Overview
---

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's web browser. The player is also browser-based with support for MP3+G, MP4 video and WebGL visualizations. The server runs locally, no internet connection required.

{{< screenshots >}}

Karaoke Forever basically has 3 parts:

- **<a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>Server:</a>** Runs on almost any OS to serve the app and your media files

- **<a href='{{< ref "docs/index.md/#karaoke-forever-the-web-app" >}}'>App:</a>** Fast, modern browser app designed for "karaoke conditions"

- **<a href='{{< ref "docs/index.md/#player" >}}'>Player:</a>** Just another part of the app, designed to run fullscreen on the system handling audio/video for a <a href='{{< ref "docs/index.md/#rooms-admin-only" >}}'>room</a>

## Features

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG){{% icon-external %}} and MP4 video support
- [MilkDrop](https://en.wikipedia.org/wiki/MilkDrop){{% icon-external %}}-style visualizations via [Butterchurn](https://github.com/jberg/butterchurn){{% icon-external %}} (requires WebGL 2)
- [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain){{% icon-external %}} volume normalization support
- Singers prioritized by time since each last sang
- Multiple simultaneous rooms/queues (optionally password-protected)
- No telemetry; all data stored locally

<br>
Karaoke Forever assumes its player will be mixed with any microphones (either in software or an outboard mixer). See the <a href='{{< ref "/faq.md#what-s-the-recommended-microphone-audio-setup" >}}'>F.A.Q.</a> for more information.

## Download

If you'll be running the <a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>server</a> on macOS or Windows, you probably want <a href="{{% baseurl %}}download">Releases</a>{{% icon-external %}}. On any OS with [Node.js](https://nodejs.org){{% icon-external %}}, see <a href='{{< ref "docs/index.md/#any-os-with-nodejs" >}}'>Installation</a>.

## Documentation

Please see <a href='{{< ref "docs/index.md/#quick-start" >}}'>Quick Start</a> to get started, or jump to the documentation for <a href='{{< ref "docs/index.md/#karaoke-forever-the-web-app" >}}'>Karaoke Forever</a> (the "web" app) or <a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>Karaoke Forever Server</a>.

## Discord / Support

Join the [Karaoke Forever Discord Server](https://discord.gg/PgqVtFq){{% icon-external %}} for general support and development chat, or just to say hi!

## Contributing & Development

See the <a href="{{% baseurl %}}repo">GitHub project page</a>{{% icon-external %}}.
