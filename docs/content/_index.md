---
title: Overview
seoTitle: Karaoke Hydra | Open karaoke party system
description: Host awesome karaoke parties where everyone can easily find and queue songs from their phone's browser. The player is also fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.
---

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's browser. The player is also fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.

{{< screenshots >}}

<p style="text-align: center;">
  <i>App in mobile browser (top) controlling player in desktop browser (bottom)</i>
</p>

## Features

- Plays:
  - MP3+G (MP3 with CDG lyrics; including zipped)
  - MP4 videos
  - Music-synced visualizations (with automatic lyrics background removal)
- Fast, modern mobile browser app designed for "karaoke conditions"
- Easy joining with QR codes and guest accounts
- Multiple simultaneous rooms/queues (optionally password-protected)
- Dynamic queues keep parties fair, fun and no-fuss
- Fully self-hosted
- No ads or telemetry

Microphones are *not* required since the player itself only outputs music - this allows your audio setup to be as simple or complex as you like. See the <a href='{{< ref "faq.md/#recommended-audio-microphone-setup" >}}'>F.A.Q.</a> for more information.

## Getting Started

 Karaoke Hydra basically has 3 parts. See <a href='{{< ref "docs/getting-started" >}}'>Getting Started</a> to get up and running step-by-step, or jump to the documentation for each part below:

- **<a href='{{< ref "docs/karaoke-eternal-server" >}}'>Server:</a>** Runs on pretty much anything to serve the web app and your media files.
- **<a href='{{< ref "docs/karaoke-eternal-app" >}}'>App:</a>** Fast, modern mobile web app designed for "karaoke conditions".
- **<a href='{{< ref "docs/karaoke-eternal-app/#player" >}}'>Player:</a>** Just another part of the app, but meant to run fullscreen on the system handling audio/video for a <a href='{{< ref "docs/karaoke-eternal-app/#rooms-admin-only" >}}'>room</a>.

## Installation

There are several <a href='{{< ref "docs/karaoke-eternal-server#installation" >}}'>installation methods</a> available for Karaoke Hydra Server.

## Discord & Support

Join the <a href="{{% baseurl %}}discord" rel="noopener">Karaoke Hydra Discord Server</a>{{% icon-external %}} for general support and development chat, or just to say hi!

## Contributing & Development

See the <a href="{{% baseurl %}}repo">GitHub project page</a>{{% icon-external %}}.

## Acknowledgements

- [David Zukowski](https://zuko.me){{% icon-external %}}: react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
- [Luke Tucker](https://github.com/ltucker/){{% icon-external %}}: the original JavaScript CD+Graphics implementation
- Mic favicon by [Freepik](https://www.freepik.com/){{% icon-external %}} from [flaticon.com](https://www.flaticon.com/){{% icon-external %}}
