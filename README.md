# Karaoke Eternal

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's browser. The player is also fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.

[![Karaoke Eternal](/docs/assets/images/README.jpg?raw=true)](/docs/assets/images/README.jpg?raw=true)

<p align="center">
  <i>App in mobile browser (top) controlling player in Firefox/Chrome (bottom)</i>
</p>

## Features

- Supports:
  - MP3+G with Winamp/MilkDrop visualizations (WebGL 2)
  - MP4 videos
  - ReplayGain tags for volume normalization
- Fast, modern mobile browser app designed for "karaoke conditions"
- Multiple simultaneous [rooms/queues](https://www.karaoke-eternal.com/docs/#rooms-admin-only) (optionally password-protected)
- Dynamic queues keep parties fair, fun and no-fuss
- Fully self-hosted
- No ads or telemetry

Karaoke Eternal assumes its player will be mixed with any microphones (either in software or an outboard mixer). See the [F.A.Q.](https://www.karaoke-eternal.com/faq#whats-the-recommended-audiomicrophone-setup) for more information.

## Getting Started

 Karaoke Eternal basically has 3 parts. You can jump to the documentation for each below, or [Quick Start](https://www.karaoke-eternal.com/docs/#quick-start) to get up and running step-by-step.

- **[App:](https://www.karaoke-eternal.com/docs/#karaoke-eternal-the-web-app)** Fast, modern mobile browser app designed for "karaoke conditions"
- **[Player:](https://www.karaoke-eternal.com/docs/#player)** Just another part of the browser app, but meant to run fullscreen on the system handling audio/video for a [room](https://www.karaoke-eternal.com/docs/#rooms-admin-only)
- **[Server:](https://www.karaoke-eternal.com/docs/#karaoke-eternal-server)** Runs on almost any OS and hardware to serve the app and your media files

## Download & Install

See <a href="https://github.com/bhj/KaraokeEternal/releases">Releases</a> and check out the [installation instructions](https://www.karaoke-eternal.com/docs/#karaoke-eternal-server).

## Discord / Support

Join the [Karaoke Eternal Discord Server](https://discord.gg/PgqVtFq) for general support and development chat, or just to say hi!

## Contributing & Development

Contributions are welcome! Please join the `#dev` channel of the [Discord Server](https://discord.gg/PgqVtFq) before embarking on major features; the project's scope is limited to ensure success.

Make sure you have [Node.js](https://nodejs.org/en/) 16 or later, then:

1. Fork and clone the repo
2. `npm i`
3. `npm run dev` and look for "Web server running at" for the **server URL**
