# Karaoke Forever

A self-hosted, multi-room, multi-user karaoke party system built on open web technologies

**NOTE: Karaoke Forever is alpha-quality software under active development.**

## Overview

Karaoke Forever lets you host awesome karaoke parties without requiring proprietary apps, 3rd-party services or even an internet connection. Everyone gets a simple email/password-based account on your (local) server and can use their phone's browser to search and queue songs. The player is also browser-based and currently supports most .cdg (CD+Graphics) lyrics files with audio as well as YouTube channels (experimental). It takes a few bits and pieces to make all this work:

### Server

Runs on a Mac/Win/Linux/etc. system on your local network to serve the app/player and media. Also houses the database of songs, user accounts, rooms, queues, etc. Currently installed and run from the command line. Packaged installers are planned (possibly also embedding the app/player)

### App (Client)

Everyone can use their phone's modern mobile browser to search by artist and title, queue songs and see who's up next without installing anything.

### Player (Client)

Just another name for the app when it's in "player" mode, so also completely browser-based. Meant to run fullscreen on the system handling a room's audio/video (also see **Audio Input** below). A desktop-class browser is recommended here because support for the fullscreen API in mobile browsers is lacking. Since it's just another client, the player doesn't have to (but can) run on the same system as the server.

### Rooms

Rooms (*think: sessions*) help organize parties by space, time or both (spacetime?) Even if you only have one physical room, create a new KF room before each session so you start with an empty queue (and keep a nice record of who sang what previously).

### Audio Input

Karaoke Forever does not currently handle audio *input* since there are a wide variety of microphone and audio interface configurations. It's recommended to use an audio interface with at least two microphone inputs and connect it to the system running the room's player (see **Player** above). This system's audio mixer is responsible for adding effects to voices (optional) and mixing them with the player output (music).

## Getting Started

### Install and run the server ###

Requires [Node.js 8 or later](https://nodejs.org/en/) or later running on Mac, Windows, Linux or whatever else Node.js and SQLite will work on.

*These steps must be performed on the system that will run the Karaoke Forever server.*

1. Clone the project to a new folder and `cd` to it
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the server (Ctrl-C at any time to stop it)
4. Watch the output for "Server is now running at:" and note the **server URL**

### Create admin account ###

*These steps can be performed from any system on your local network, provided the server started without errors.*

1. Browse to the **server URL** (include the port number, e.g. http://10.0.1.2:3000) and you should see the app prompting to create your first (admin) account
2. Enter your user details and click Create Account
3. You should now be signed in to your account page and see the **Providers** and **Rooms** sections. Onward!

### Set up providers ###

Each provider (*think: plugin*) handles songs of a particular format. Karaoke Forever currently includes two:

**CD+Graphics (.cdg + audio)**

Supports CD+Graphics (.cdg) files with identically named audio (.mp3 or .mp4) files alongside. Add the folder(s) containing your .cdg + audio files and hit Refresh to start the scanner. *Container and codec support can vary depending on the browser running the player.*

**YouTube (experimental)**

Supports YouTube videos on a per-channel basis. This requires a [YouTube API Developer Key](https://developers.google.com/youtube/v3/getting-started) (free) because it's currently the only way to get a complete list of a channel's videos. Enter your YouTube API Developer Key, add YouTube channel names (usually usernames) and hit Refresh to retrieve the video lists. Some channels unfortunately restrict playback of their videos in 3rd-party apps. The following channels are known to work (Karaoke Forever is not affiliated with YouTube or these users/channels):

- singkingkaraoke ([Patreon](https://www.patreon.com/singkingkaraoke), [YouTube](https://www.youtube.com/user/singkingkaraoke))

### Create and join a room ###

There needs to be an open room before others can sign in. Only admins can create rooms, so it's up to you!

1. In the Rooms section of your account page, click Create Room
2. On the just-created room, click Join
3. You'll be taken to the room's Queue view (currently empty of course) and can now queue songs from the Library view

We're still missing a player, but at this point others can visit the server URL from their phone's browser and select this room to login or create an account.

### Start player ###

*If you're not on the system that will be running the player (see **Player** in the Overview above) go there now, sign in via the server URL, and join the room.*

When you're an admin in a room without a player, you'll see a notice at the top with a **Start Player** link. Click it and you should now see the player, along with playback controls and a button to go fullscreen.

The room's playback controls (play/pause, next and volume) are always available as an admin. When in play mode, the player will play as long as there are songs in the queue. It will stay in play mode even when out of songs so that the next time a song is queued it will start automatically.

You're now ready to test your audio setup and start the party!

## Screenshots

Coming soon

## Contributing

Contributions are most welcome! This project is designed with ease of development as a primary goal.

## Acknowledgements

- [David Zukowski](https://zuko.me): react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
- [Luke Tucker](https://github.com/ltucker/): the JavaScript/HTML5 canvas CD+Graphics player
- Stuart Albert: the name (a reference to Duke Nukem Forever given the development fits, (re)starts, and *almost* vaporware status)

## License

MIT License

Copyright (c) 2017 Brandon H. Jones
