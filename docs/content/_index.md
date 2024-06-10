---
title: Overview
seoTitle: Karaoke Eternal | Open karaoke party system
description: Host awesome karaoke parties where everyone can easily find and queue songs from their phone's browser. The player is also fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.
---

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's browser. The player is also fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.

{{< screenshots >}}

<p style="text-align: center;">
  <i>App in mobile browser (top) controlling player in Firefox/Chrome (bottom)</i>
</p>

## Features

- Supports:
  - MP3+G with Winamp/MilkDrop visualizations (WebGL 2)
  - MP4 videos
  - ReplayGain tags for volume normalization
- Fast, modern mobile browser app designed for "karaoke conditions"
- Multiple simultaneous rooms/queues (optionally password-protected)
- Dynamic queues keep parties fair, fun and no-fuss
- Fully self-hosted
- No ads or telemetry

Microphones are *not* required since the player itself only outputs music - this allows your audio setup to be as simple or complex as you like. See the <a href='{{< ref "faq.md/#whats-the-recommended-audiomicrophone-setup" >}}'>F.A.Q.</a> for more information.

## Getting Started

 Karaoke Eternal basically has 3 parts. See <a href='{{< ref "docs/getting-started" >}}'>Getting Started</a> to get up and running step-by-step, or jump to the documentation for each part below:

- **<a href='{{< ref "docs/karaoke-eternal-server" >}}'>Server:</a>** Runs on pretty much anything to serve the web app and your media files, including a Windows PC, Mac, or a dedicated server like a Raspberry Pi or Synology NAS.
- **<a href='{{< ref "docs/karaoke-eternal-app" >}}'>App:</a>** Fast, modern mobile web app designed for "karaoke conditions".
- **<a href='{{< ref "docs/karaoke-eternal-app/#player" >}}'>Player:</a>** Just another part of the app, but meant to run fullscreen on the system handling audio/video for a <a href='{{< ref "docs/karaoke-eternal-app/#rooms-admin-only" >}}'>room</a>.


## Installation

There are several <a href='{{< ref "docs/karaoke-eternal-server#installation" >}}'>installation methods</a> available for Karaoke Eternal Server.

## Discord & Support

Join the <a href="{{% baseurl %}}discord" rel="noopener">Karaoke Eternal Discord Server</a>{{% icon-external %}} for general support and development chat, or just to say hi!

## Contributing & Development

See the <a href="{{% baseurl %}}repo">GitHub project page</a>{{% icon-external %}}.

## Acknowledgements

- [David Zukowski](https://zuko.me){{% icon-external %}}: react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
- [Luke Tucker](https://github.com/ltucker/){{% icon-external %}}: the original JavaScript CD+Graphics implementation
- Mic favicon by [Freepik](https://www.freepik.com/){{% icon-external %}} from [flaticon.com](https://www.flaticon.com/){{% icon-external %}}
