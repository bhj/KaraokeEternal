# Karaoke Forever

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's web browser. The player is also browser-based with support for [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) and MP4 video files. The server runs on your local network (see [Karaoke Forever Server](https://www.karaoke-forever.com/docs/#karaoke-forever-server)) with no internet connection required.

Karaoke Forever basically has 3 parts:

- **[Server:](https://www.karaoke-forever.com/docs/#karaoke-forever-server)** Runs on Mac/Windows/Linux/etc. to serve the app and media files on your local network.

- **[Mobile browser app:](https://www.karaoke-forever.com/docs/#karaoke-forever)** Everyone can quickly join and queue songs without having to install anything.

- **[Player:](#player-admin-only)** Just another part of the browser app, but designed to run in fullscreen mode on the system handling audio and video for a [room](https://www.karaoke-forever.com/docs/#rooms-admin-only).

## Features

- Modern browser-based app and player with dark UI designed for "karaoke conditions"
- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) and MP4 video file support
- Milkdrop visualizations via [Butterchurn](https://github.com/jberg/butterchurn) (requires [WebGL 2](https://caniuse.com/#feat=webgl2))
- Prioritizes singers based on the amount of time since each last sang
- Multiple simultaneous rooms/queues/players

Karaoke Forever assumes its player will be mixed with any microphones (either in software or an outboard mixer). See the [F.A.Q.](https://www.karaoke-forever.com/faq/#whats-the-recommended-microphone-audio-setup) for more information.

## Download

Packaged builds of [Karaoke Forever Server](https://www.karaoke-forever.com/docs/#karaoke-forever-server) for macOS and Windows are available on the <a href="{{ site.github.releases_url }}">Releases</a> page.

## Documentation

Please see [Quick Start](https://www.karaoke-forever.com/docs#quick-start) to get started, or jump to the documentation for [Karaoke Forever](https://www.karaoke-forever.com/docs/#karaoke-forever) (the "web" app) or [Karaoke Forever Server](https://www.karaoke-forever.com/docs/#karaoke-forever-server).

## Discord / Support

Join the [Karaoke Forever Discord Server](https://discord.gg/PgqVtFq) for general support and development chat, or just to say hi!

## Contributing & Development

Contributions are most welcome! To get started developing
make sure you have [Node.js 12](https://nodejs.org/en/) or later, then:

1. Clone the project
2. `npm install`
3. `npm run dev` and look for "Web server running at" for the **server URL**
