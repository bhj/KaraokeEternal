# Karaoke Forever

Host awesome local karaoke parties where anyone can join using their phone. Supports CD+Graphics (cdg+mp3/m4a) and video (mp4) files.

## Overview

### Server

Runs on the Mac/Windows/Linux/etc. system hosting your media.

### App

A browser-based mobile app lets everyone find, favorite and queue songs.

### Player

Just another name for the app when it's in "player" mode. Designed for a browser to run in fullscreen, usually on the system handling audio/video (see **Audio Input** below). A desktop-class browser is recommended due to limitations in mobile browsers' fullscreen API support. The player doesn't have to run on the same system as the server.

### Rooms

Karaoke Forever uses "rooms" to organize parties by space and time (spacetime?) Think *sessions*, so create a new KF room before each party so that you start with an empty queue.

### Audio Input

Karaoke Forever does not handle audio *input* since there are a wide variety of configurations. Normally an audio interface with at least two microphone inputs would be connected to the system running the player (see **Player** above).

## Getting Started

### Install and run the server ###

Requires [Node.js 8](https://nodejs.org/en/) or later on Mac, Windows, Linux or whatever else Node.js, SQLite and bcrypt will work on.

*These steps must be performed on the system that will run the Karaoke Forever server.*

1. Clone the project to a new folder and `cd` to it
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the server (Ctrl-C at any time to stop it)
4. Watch the output for "Server is now running at:" and note the **server URL**

### Create admin account ###

*These steps can be performed from any system on your local network, provided the server started without errors.*

1. Browse to the **server URL** (include the port number, e.g. http://10.0.1.2:3000) and you should see the app prompting to create your first (admin) account
2. Enter your user details and click Create Account
3. You're now signed in as an admin to your first room. At this point others can visit the server URL from their phone's browser and login or create an account.

### Add media ###

In the Preferences widget (visible when you're an admin), tap Media Folders and add the folder(s) containing your .cdg and audio files. *Container and codec support can vary depending on the player browser.*

### Start the player ###

*If you're not on the system that will be running the player go there now and sign in via the server URL.*

You've probably noticed a warning that there's no Player in the room. Let's fix that now - hit **Start Player**. The room's playback controls (play/pause/next and volume) will be visible to the current singer and always available to admins. In "play" mode, the player plays as long as there are songs in the queue, and after running out of songs the next one to be queued will start immediately.

You're now ready to test your audio setup and start the party!

## Screenshots

Coming soon

## Contributing

Contributions are most welcome!

## Acknowledgements

- [David Zukowski](https://zuko.me): react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
- [Luke Tucker](https://github.com/ltucker/): JavaScript/HTML5 canvas CD+Graphics player
- Carter Corker: Technical things
- Stuart Albert: The name (a reference to Duke Nukem Forever, given the *almost* vaporware status)
- B&W mic icon by [Freepik](http://www.freepik.com/) from [flaticon.com](http://www.flaticon.com/)

## License

MIT License

Copyright (c) 2018 Brandon H. Jones
