---
layout: default
title: Overview
---
<h1 class="overview">Overview</h1>

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's web browser. The player is also browser-based with support for [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> and MP4 video files. The server runs on your local network (see [Karaoke Forever Server](https://www.karaoke-forever.com/docs/#karaoke-forever-server)) with no internet connection required.

Karaoke Forever basically has 3 parts:

- **[Server:](https://www.karaoke-forever.com/docs/#karaoke-forever-server)** Runs on Mac/Windows/Linux/etc. to serve the app and media files on your local network.

- **[Mobile browser app:](https://www.karaoke-forever.com/docs/#karaoke-forever)** Everyone can quickly join and queue songs without having to install anything.

- **[Player:](#player-admin-only)** Just another part of the browser app, but designed to run in fullscreen mode on the system handling audio and video for a [room](https://www.karaoke-forever.com/docs/#rooms-admin-only).

## Features

- Modern browser-based app and player with dark UI designed for "karaoke conditions"
- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> and MP4 video file support
- Milkdrop visualizations via [Butterchurn](https://github.com/jberg/butterchurn)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> (requires [WebGL 2](https://caniuse.com/#feat=webgl2)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>)
- Prioritizes singers based on the amount of time since each last sang
- Multiple simultaneous rooms/queues/players

<br>
Karaoke Forever assumes its player will be mixed with any microphones (either in software or an outboard mixer). See the [F.A.Q.](https://www.karaoke-forever.com/faq/#whats-the-recommended-microphone-audio-setup) for more information.

## Download

The latest release of [Karaoke Forever Server](https://www.karaoke-forever.com/docs/#karaoke-forever-server) for macOS and Windows is available on the <a href="{{ site.github.releases_url }}">Releases</a><svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> page.

## Documentation

Please see [Quick Start](https://www.karaoke-forever.com/docs/#quick-start) to get started, or jump to the documentation for [Karaoke Forever](https://www.karaoke-forever.com/docs/#karaoke-forever) (the "web" app) or [Karaoke Forever Server](https://www.karaoke-forever.com/docs/#karaoke-forever-server).

## Discord / Support

Join the [Karaoke Forever Discord Server](https://discord.gg/PgqVtFq)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> for general support and development chat, or just to say hi!

## Contributing & Development

See the <a href="{{ site.github.repository_url }}">GitHub project page</a><svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>.
