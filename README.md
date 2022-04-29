# Karaoke Eternal

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's browser. The player is also fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.

[![Karaoke Eternal](/docs/assets/images/README.jpg?raw=true)](/docs/assets/images/README.jpg?raw=true)

<p align="center">
  <i>App in mobile browser (top) controlling player in Firefox/Chrome (bottom)</i>
</p>

## Features

- Supports:
  - [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) with WebGL visualizations (MilkDrop-style)
  - MP4 videos
  - ReplayGain tags for volume normalization
- Fast, modern mobile browser app designed for "karaoke conditions"
- Dynamic queues keep parties fun, fair and no-fuss
- Multiple simultaneous [rooms/queues](https://www.karaoke-eternal.com/docs/#rooms-admin-only) (optionally password-protected)
- Fully self-hosted
- No ads or telemetry

Karaoke Eternal assumes its player will be mixed with any microphones (either in software or an outboard mixer). See the [F.A.Q.](https://www.karaoke-eternal.com/faq#whats-the-recommended-audio-setup) for more information.

## Overview

 Karaoke Eternal basically has 3 parts. You can jump to the documentation for each below, or [Quick Start](https://www.karaoke-eternal.com/docs/#quick-start) to get up and running step-by-step.

- **[Server:](https://www.karaoke-eternal.com/docs/#karaoke-eternal-server)** Runs on almost any OS and hardware to serve the app and your media files
- **[App:](https://www.karaoke-eternal.com/docs/#karaoke-eternal-the-web-app)** Fast, modern mobile browser app designed for "karaoke conditions"
- **[Player:](https://www.karaoke-eternal.com/docs/#player)** Just another part of the app, designed to run fullscreen on the system handling audio/video for a [room](https://www.karaoke-eternal.com/docs/#rooms-admin-only)

## Download & Install

See <a href="https://github.com/bhj/KaraokeEternal/releases">Releases</a> available for your OS and the [installation instructions](https://www.karaoke-eternal.com/docs/#karaoke-eternal-server).

## Discord / Support

Join the [Karaoke Eternal Discord Server](https://discord.gg/PgqVtFq) for general support and development chat, or just to say hi!

## Contributing & Development

Contributions are most welcome! Make sure you have [Node.js](https://nodejs.org/en/) 16 or later, then:

1. Fork and clone the repo
2. `npm i`
3. `npm run dev` and look for "Web server running at" for the **server URL**
