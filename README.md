# Karaoke Forever

A self-hosted, multi-room, multi-user karaoke party system built on open web technologies

**NOTE: Karaoke Forever is alpha-quality software under active development.**

## Overview

Karaoke Forever lets you host awesome karaoke parties without depending on proprietary apps or 3rd-party services. Everyone can search, queue and favorite songs from their phone's browser and gets a simple email/password-based account on your local KF server. The player is also browser-based and supports most MP3+CDG (CD+Graphics) files as well as YouTube channels (experimental). It takes a few bits and pieces to make all this work:

### Server

Runs on a computer on your local network and serves the app to phones and media to the player. It also houses the song library and user accounts, manages rooms and queues, etc. It's built on Node.js + SQLite and should be compatible with at least Mac, Windows and Linux. Currently the server is installed via npm and run from the command line; packaged installers are planned (possibly also embedding the app/player)

### App (Client)

Designed for modern mobile browsers, everyone can search songs by artist and title, queue them, and see who's up next  all from their phone without having to install anything.

### Player (Client)

Another name for the app when it's in "player" mode, the player is designed to run fullscreen in a browser on the system handling audio/video output (and usually input; see **Audio Input** below). A desktop-class browser is recommended because support for the fullscreen API in mobile browsers is lacking. Since it's just another client, the player doesn't have to (but can) run on the same system as the server.

### Audio Input

Karaoke Forever does not currently handle audio *input* since there are a wide variety of microphone and audio interface configurations. A typical 2-mic setup might include a USB audio interface having two microphone inputs, with the interface connected to the system running the room's player. That system's audio mixer is responsible for combining the microphone sources with the player (music) and sending it to the room's speakers.

## Getting Started

### Install the Server

The Karaoke Forever server requires [Node.js 7.6 or later](https://nodejs.org/en/).

1. Clone the repo
2. Run `npm install`
3. Run `npm run dev`
4. Go to the URL shown in "Server is now running at:" from a browser
5. Create your user account (the first account will have admin privileges)

### Setup Providers

Each *provider* handles media of a particular type or format. They can be enabled and disabled as needed (songs from disabled providers will not be visible in the library). Two are installed by default:

**CD+Graphics (CDG)**

Supports CD+Graphics (.cdg) files with identically named audio files alongside (looks for .mp3 or .mp4 by default; container and codec support can vary depending on the browser running the player). Add the folder(s) containing your karaoke files and hit Refresh to start the scanner. New songs will appear as they are added to the library.

**YouTube (experimental)**

Supports YouTube videos on a per-channel basis. This requires a [YouTube API Developer Key](https://developers.google.com/youtube/v3/getting-started) because it's currently the only way to get a complete list of a channel's videos. Unfortunately not all channels enable playback of their videos in 3rd-party apps either, but it's an option if you don't have any .cdg files.

### Create a Room

Karaoke Forever uses *rooms* (think: sessions) to help organize parties by space, time or both (spacetime?). Even if you only have one physical room, create a KF room before each party so you'll start with an empty queue (and have a nice record of who sang what previously). Once a room is created and open, others can visit the server URL from their phone's browser and login/create an account. Non-admins must choose a room when logging in because their sessions are tied to a room (once that room is closed they'll have to login to another open room)

## Screenshots

Coming soon

## License

MIT License

Copyright (c) 2017 Brandon H. Jones
