---
title: Overview
---

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's web browser. Use your own database of karaoke songs, or enable YouTube search with automatic vocal removal and lyrics alignment. The player is also browser-based with support for MP3+G, MP4 video and WebGL visualizations. The server is self-hosted with no internet connection required (unless YouTube search is enabled).

{{< screenshots >}}

<p style="text-align: center;">
  <i>App in mobile browser (top/left) controlling player in Firefox/Chrome (bottom/right)</i>
</p>

## Features

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG){{% icon-external %}} and MP4 video support
- YouTube search with automatic vocal removal and accurate word-level lyrics alignment
- [MilkDrop](https://en.wikipedia.org/wiki/MilkDrop){{% icon-external %}}-style visualizations via [Butterchurn](https://github.com/jberg/butterchurn){{% icon-external %}} (requires WebGL 2)
- [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain){{% icon-external %}} volume normalization support
- Singers prioritized by time since each last sang
- Multiple simultaneous rooms/queues (optionally password-protected)
- No ads or telemetry; all data stored locally

Karaoke Forever assumes its player will be mixed with any microphones (either in software or an outboard mixer). See the <a href='{{< ref "faq.md/#whats-the-recommended-audio-setup" >}}'>F.A.Q.</a> for more information.

## Download & Install

See <a href="{{% baseurl %}}download">Releases</a>{{% icon-external %}} available for your OS, as well as the <a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>installation documentation</a>.

Please note that the main branch is actively developed and is not guaranteed to be stable.

## Getting Started

 Karaoke Forever basically has 3 parts. You can jump to the documentation for each below, or <a href='{{< ref "docs/index.md/#quick-start" >}}'>Quick Start</a> to get up and running step-by-step.

- **<a href='{{< ref "docs/index.md/#karaoke-forever-server" >}}'>Server:</a>** Runs on almost any OS to serve the app and your media files
- **<a href='{{< ref "docs/index.md/#karaoke-forever-the-web-app" >}}'>App:</a>** Fast, modern mobile browser app designed for "karaoke conditions"
- **<a href='{{< ref "docs/index.md/#player" >}}'>Player:</a>** Just another part of the app, designed to run fullscreen on the system handling audio/video for a <a href='{{< ref "docs/index.md/#rooms-admin-only" >}}'>room</a>

## Discord / Support

Join the [Karaoke Forever Discord Server](https://discord.gg/PgqVtFq){{% icon-external %}} for general support and development chat, or just to say hi!

## Contributing & Development

See the <a href="{{% baseurl %}}repo">GitHub project page</a>{{% icon-external %}}.
