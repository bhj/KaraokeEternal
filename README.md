# Karaoke Forever

A self-hosted, multi-room, multi-user karaoke party system built on open web technologies

**NOTE: Karaoke Forever is alpha-quality software under active development.**

## Overview

Karaoke Forever lets you host awesome karaoke parties without requiring proprietary apps, 3rd-party services or even an internet connection. Everyone gets a simple email/password-based account on your (local) server and can use their phone's browser to search and queue songs. The player is also browser-based and supports most .cdg (CD+Graphics) lyrics files as well as certain YouTube channels (experimental). It takes a few bits and pieces to make all this work:

### Server

Runs on a Mac/Win/Linux system on your local network to serve the app/player and media. Also houses the database of songs, user accounts, rooms, queues, etc. Currently installed via npm and run from the command line. Packaged installers are planned (possibly also embedding the app/player)

### App (Client)

Everyone can search songs, queue them and see who's up next without having to install anything on their phone. Designed from the ground-up for modern mobile browsers.

### Player (Client)

Just another name for the app when it's in "player" view, so also completely browser-based. Meant to run in fullscreen mode on the system handling a room's audio/video output (and usually input; see **Audio Input** below). A desktop-class browser is recommended here because support for the fullscreen API in mobile browsers is lacking. Since it's just a client, the player doesn't have to (but can) run on the same system as the server. It is assumed that there will be one player running per room (see **Rooms** below)

### Providers

Each provider (*think: plugin*) handles a particular song format. Providers can be enabled and disabled as needed; songs from disabled providers will not be visible in the library. Karaoke Forever currently includes two providers:

**CD+Graphics (.cdg + audio)**

Plays CD+Graphics (.cdg) files alongside identically named audio (.mp3 or .mp4) files. Add the folder(s) containing your karaoke files and hit Refresh to start the scanner. New songs will appear in the Library view as they are added. *Container and codec support can vary depending on the browser running the player.*

**YouTube (experimental)**

Plays YouTube videos on a per-channel basis. This requires a [YouTube API Developer Key](https://developers.google.com/youtube/v3/getting-started) (free) because it's currently the only way to get a complete list of a channel's videos. Unfortunately not all channels enable playback of their videos in 3rd-party apps either, but it's an option if you don't have any .cdg files.

Channels known to work (please support them):

- singkingkaraoke ([Patreon](https://www.patreon.com/singkingkaraoke), [YouTube]())

Karaoke Forever is not affiliated with YouTube or the users/channels listed above.

### Rooms

Rooms (*think: sessions*) help organize parties by space, time or both (*spacetime?*) Even if you only have one physical room, create a new KF room before each party so you start with an empty queue (and keep a clean record of who sang what previously). Once a room is created and open, others can visit the server URL from their phone's browser and login or create an account. Non-admins must choose a room when logging in because their sessions are tied to a room (once that room is closed they'll have to login to another open room).

### Audio Input

Karaoke Forever does not currently handle audio *input* since there are a wide variety of microphone and audio interface configurations. We recommend a USB or Thunderbolt-based audio interface with at least two microphone inputs. Usually the audio interface is connected to the system running the room's player. This system's audio mixer is responsible for adding effects (such as reverb) to the voices, mixing it with the music (player output) and sending the mix to the room's speakers.

## Getting Started

[Node.js 8 or later](https://nodejs.org/en/) is required.

1. Clone the project to a new folder
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the server
4. From a browser, go to the "Server is now running at:" URL shown in the previous step (include the port number; e.g. http://10.0.1.2:3000)
5. Create your admin account (the first account will have admin privileges)
6. Configure providers (see **Providers** in Overview above)
7. Create a Room (see **Rooms** in Overview above)

## Screenshots

Coming soon

## Acknowledgements

- [davezuko](https://zuko.me)'s react-redux-starter-kit, which this project began as a fork of, and all its contributors - which are listed on this project's Contributor list (up until it was detached to its own project)
- [ltucker](https://github.com/ltucker/)'s JavaScript/HTML5 canvas CD+Graphics player

## License

MIT License

Copyright (c) 2017 Brandon H. Jones
