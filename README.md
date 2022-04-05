# Karaoke Eternal

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's web browser. The player is also browser-based with support for MP3+G, MP4 video and WebGL visualizations. The server is self-hosted with no internet connection required.

[![Karaoke Eternal](/docs/assets/images/README.jpg?raw=true)](/docs/assets/images/README.jpg?raw=true)

<p align="center">
  <i>App in mobile browser (top) controlling player in Firefox/Chrome (bottom)</i>
</p>

## Features

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) and MP4 video support
- [MilkDrop](https://en.wikipedia.org/wiki/MilkDrop)-style visualizations via [Butterchurn](https://github.com/jberg/butterchurn) (requires WebGL 2)
- [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain) volume normalization support
- Singers prioritized by time since each last sang
- Multiple simultaneous [rooms](https://www.karaoke-eternal.com/docs/#rooms-admin-only)/queues (optionally password-protected)
- No ads or telemetry; all data stored locally

Karaoke Eternal assumes its player will be mixed with any microphones (either in software or an outboard mixer). See the [F.A.Q.](https://www.karaoke-eternal.com/faq#whats-the-recommended-audio-setup) for more information.

## Download & Install

See <a href="https://github.com/bhj/KaraokeEternal/releases">Releases</a> available for your OS, as well as the [installation documentation](https://www.karaoke-eternal.com/docs/#karaoke-eternal-server).

Please note that the main branch is actively developed and is not guaranteed to be stable.

## Getting Started

 Karaoke Eternal basically has 3 parts. You can jump to the documentation for each below, or [Quick Start](https://www.karaoke-eternal.com/docs/#quick-start) to get up and running step-by-step.

- **[Server:](https://www.karaoke-eternal.com/docs/#karaoke-eternal-server)** Runs on almost any OS to serve the app and your media files
- **[App:](https://www.karaoke-eternal.com/docs/#karaoke-eternal-the-web-app)** Fast, modern mobile browser app designed for "karaoke conditions"
- **[Player:](https://www.karaoke-eternal.com/docs/#player)** Just another part of the app, designed to run fullscreen on the system handling audio/video for a [room](https://www.karaoke-eternal.com/docs/#rooms-admin-only)

## Discord / Support

Join the [Karaoke Eternal Discord Server](https://discord.gg/PgqVtFq) for general support and development chat, or just to say hi!

## Contributing & Development

Contributions are most welcome! Make sure you have [Node.js](https://nodejs.org/en/) 12 or later, then:

1. Fork and clone the repo
2. `npm i`
3. `npm run dev` and look for "Web server running at" for the **server URL**
