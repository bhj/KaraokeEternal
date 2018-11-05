---
permalink: /docs/index.html
---
# Karaoke Forever

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Karaoke Forever](#karaoke-forever-the-web-app) (the web app)
  - [Library](#library)
  - [Queue](#queue)
  - [Account](#account)
    - [Rooms](#rooms-admin-only) (admin only)
    - [Preferences](#preferences-admin-only) (admin only)
    - [My Account](#my-account)
  - [Player](#player-admin-only) (admin only)
- [Karaoke Forever Server](#karaoke-forever-server)
  - [Installation](#installation)
  - [Supported Media Files](#supported-media-files)
  - [The Meta Parser](#the-meta-parser)
    - [Configuring the Parser](#configuring-the-parser)
    - [Augmenting or Replacing the Parser (Advanced)](#augmenting-or-replacing-the-parser-advanced)
  - [Command Line Options](#command-line-options)
  - [File Locations](#file-locations)

## Overview

Host awesome karaoke parties where everyone can find and queue songs from their phone's web browser. Supports [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) (mp3+cdg) and mp4 video files. No internet connection required; your data stays on your server on your local network.

**Note:** Karaoke Forever does not handle audio *input* since there is a wide variety of possible setups. It's recommended to use a low-latency audio interface with at least two microphones that will be mixed with the Player's output.

Karaoke Forever has a few parts:

- **[Server:](#karaoke-forever-server)** Runs on the macOS/Windows/Linux/etc. system with your [supported media files](#supported-media-files) and serves the web app on your local network.

- **[Web app:](#karaoke-forever-the-web-app)** Built from the ground up for mobile browsers, anyone can easily join using their phone.

- **[Player:](#player-admin-only)** Just another part of the web app, but designed to run fullscreen on the system handling audio/video for the room.

## Quick Start

1. Install and run Karaoke Forever Server on the system that will serve the media files and web app on your local network. **Important:** The server app is not currently signed, so macOS and Windows SmartScreen will complain by default. *Do not disable Gatekeeper* on macOS - simply right-click the file and choose Open.

2. Click the Karaoke Forever Server menubar icon (macOS) or right-click the tray icon (Windows) to show the server URL. You can click *Open in browser* or browse to the server URL (including port) from any device on the network. The web app is primarily designed for mobile browsers.

3. Enter your user details and click Create Account to create your admin account.

4. In the Preferences panel, tap Media Folders and add folder(s) with your [supported media](#supported-media-files). Songs will appear in the library when the scan is complete.

5. If you are not on the system that will be the [player](#player-admin-only) (handling audio/video) go there now, browse to the server URL and sign in with your admin account.

6. You should see a notice that no players are present in the [room](#rooms-admin-only), so tap the Start Player link. (If you don't see a notice it means the browser does not support fullscreen mode; you can still navigate to `/player` manually for this walkthrough)

7. Now that a player is running, use another device (or browser tab) to queue some songs and press play to begin. The player will play as long as there are songs in the queue, and after running out of songs the next one to be queued will start immediately.

You are now ready to test your audio setup and start the party!

## Karaoke Forever (the web app)

### Library

The library page lists available songs organized by artist, and allows searching both artists and titles. Tapping a song's title will add it to the queue, and tapping its star will favorite it.

If you're an admin, you may see songs with an italicized number at the end, like *(2)*. That would mean there are two versions (media files) of the song. The version in the folder with the highest priority will be queued when tapped (see [Preferences](#preferences-admin-only)).

Admins can reveal additional options for each song by swiping left. Currently the only additional option is Get Info, which shows the song's underlying media file(s).

### Queue

The queue page shows the current, upcoming and previously played songs. Users can remove any of their upcoming songs and will see a notice (on all pages) when they're up next.

While a user is up they temporarily have access to the playback controls, including pause, play, next and volume. Admins always have access to these controls.

### Account

The account page lets users update their account, and will have a few additional panels for admins.

#### Rooms (Admin Only)

The Rooms panel allows admins to create, edit and remove rooms.

Karaoke Forever uses "rooms" to organize sessions by space and time (spacetime?) Rooms can be either open or closed, and every room has its own song queue. Users choose an open room when signing in.

**Warning:** Removing a room will also remove its queue, so the history of songs played during that session will be lost.

**Note:** Closing a room does not sign out users currently in it; only new sign-ins will be prevented.

#### Preferences (Admin Only)

The Preferences panel allows admins to configure Karaoke Forever. These settings are global (there are currently no per-user settings).

- **Media Folders:** Add folders with [supported media files](#supported-media-files) to scan them into the library. When multiple folders contain a version of the same song, the version in the folder highest in this list will be used. Karaoke Forever Server does not automatically detect changes to media folders; click Refresh to re-scan.

#### My Account

This panel lets users change their name, username or password and sign out.

### Player (admin only)

The player is just another page of the web app that's designed to run in fullscreen mode, usually on the system handling audio/video for a room.

When an admin signs in to a [room](#rooms-admin-only) that does not yet have a player running, a notice will appear with a handy link to `/player`. If no notice appears it means the browser does not support fullscreen mode.

The player has been tested on the current versions of these (desktop) browsers:

- Chrome
- Firefox
- Safari
- Edge

Internet Explorer is not supported.

**Note:** A desktop-class browser is recommended due to limitations in the fullscreen support of some mobile browsers.

**Tip:** Most browsers will mute or prevent playback of media on a page that hasn't been interacted with yet. Pressing play on the player page is usually sufficient, or you can whitelist the player page in your browser.

## Karaoke Forever Server

### Installation

The server is bundled as a macOS and Windows application for convenience.

**Important:** The server app is not currently signed, so macOS and Windows SmartScreen will complain by default. *Do not disable Gatekeeper* on macOS - simply right-click the file and choose Open.

Once running, click the Karaoke Forever Server menubar icon (macOS) or right-click the tray icon (Windows) to show the server URL. You can click *Open in browser* or browse to the server URL (be sure to include the port) from any device on the network. Note that the web app is primarily designed for mobile browsers.

You can also run the server on most any platform with Node.js 10 or later:

1. Clone the project repository
2. `npm install`
3. `npm run compile`
4. `npm run serve` and look for "Web server running at" for the **server URL**

### Supported Media Files

The following file formats are supported:

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) (CD+Graphics and MP3 audio in separate files)

  The .cdg and .mp3 files must have the same name. Karaoke Forever will also look for an .m4a file and use it instead of the .mp3 if it finds one.

- MP4 (video with audio)

  Note that since mp4/m4a files are only containers, codec support can vary depending on the browser running the [player](#player-admin-only).

Media folders can be added via the [Preferences](#preferences-admin-only) section of the web app (when signed in as an admin). Media files that can't be scanned will not appear in the library, and are [logged to a file](#file-locations) by default. To change the level of logging, see [Command Line Options](#command-line-options).

Karaoke Forever expects media filenames to be in the format "Artist - Title" by default. To customize the filename parser's behavior, see [The Meta Parser](#the-meta-parser).

### The Meta Parser

Karaoke Forever expects media filenames to be in the format "Artist - Title" by default, but the parser can be configured on a per-folder basis using a `_kfconfig.js` file. When a `_kfconfig.js` file is encountered in a folder it applies to all files and subfolders within. If any subfolders have their own `_kfconfig.js` files, those take precedence.

#### Configuring the Parser

You can configure the default parser's behavior by returning an object with the options you want to override. For example, if a folder instead has filenames in the format "Title - Artist", you might drop in the following `_kfconfig.js` file:

```js
return {
  artistOnLeft: false, // override default
}
```

*Note:* It's important to `return` the configuration object. JSON format is not currently supported.

The default configuration is as follows:

```js
return {
  articles: ['A', 'An', 'The'], // false will disable article normalization
  artistOnLeft: true,
  separator: '-',
}
```

#### Creating a Parser (Experimental)

Instead of a configuration object (as shown above), you can return a function that will be used to create a new parser, allowing anything from tweaking to completely replacing the stock one. This can be useful if you have many filenames that need extra processing to appear nicely in the library.

Karaoke Forever uses a simple middleware-based filename parser. Here *middleware* refers to an individual function, and *parser* refers to a composed stack of middleware (that is itself a function). Your `_kfconfig.js` should return a *parser creator*, in other words, a function that will be called to get the parser for the current folder.

Your parser creator has access to the [default parser and middleware](https://github.com/bhj/karaoke-forever/blob/master/server/Scanner/MetaParser/defaultMiddleware.js) so it doesn't have to reinvent the wheel. For example, this will create a parser that removes the word 'junk' from filenames, then runs the default parser:

```js
return ({ compose, getDefaultParser, defaultMiddleware }) => {
  function customMiddleware (ctx, next) {
    ctx.file = ctx.file.replace('junk', '')
    next()
  }

  return compose(
    customMiddleware,
    getDefaultParser(), // optionally accepts a configuration object
  )
}

```

Your parser creator will be passed an object with the following properties:

- `compose` Function that takes functions (or arrays of functions) as arguments and returns a single composed function that can be used as a parser.
- `getDefaultParser` Function that returns the default parser. Optionally accepts a configuration object (see [Configuring the Parser](#configuring-the-parser)). The default parser can itself be used as middleware, with custom middleware run before and/or after.
- `defaultMiddleware`  [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) containing the [default  middleware](https://github.com/bhj/karaoke-forever/blob/master/server/Scanner/MetaParser/defaultMiddleware.js) in order. This can be used to recompose the middleware for your custom parser.

When Karaoke Forever scans a media file, it calls the parser with an object (`ctx`) having the `file` property (filename string, without extension). At the end of the middleware stack this object should have the following properties:

- `artist` String with the artist's name as it will be shown in the library. Required.
- `title` String with the song's title as it will be shown in the library. Required.
- `artistNormalized` String with the artist's name as it will be used internally for matching and sorting. Defaults to `artist` if not set.
- `titleNormalized` String with the song's title as it will be used internally for matching and sorting. Defaults to `title` if not set.

It's important that each middleware calls `next` unless you don't want the chain to continue (for instance, if you've set `artist` and `title` manually and want to use them as-is).

### Command Line Options

Karaoke Forever Server supports the following command line options:

| Option | Description | Default |
| --- | --- | --- |
| <span style="white-space: nowrap;">`-l, --loglevel <number>`</span>| Log file level (**0**=off, **1**=error, **2**=warn, **3**=info, **4**=verbose, **5**=debug) | 2 |
| <span style="white-space: nowrap;">`-p, --port <number>`</span>| Web server port. To use low ports such as 80 (so users don't have to include the port in the URL) the server usually must be run with administrative privileges. | 0 (auto) |
| <span style="white-space: nowrap;">`--version`</span>| Output the Karaoke Forever Server version and exit. | |

For example, to start the server on port 80 in macOS:

```
$ sudo /Applications/Karaoke\ Forever\ Server.app/Contents/MacOS/Karaoke\ Forever\ Server -p 80
```

### File Locations

#### macOS

 - Database: `~/Library/Application Support/Karaoke Forever Server/database.sqlite3`
 - Log: `~/Library/Logs/Karaoke Forever Server/log.log`

#### Windows

- Database: `%APPDATA%\Karaoke Forever Server\database.sqlite3`
- Log: `%APPDATA%\Karaoke Forever Server\log.log`
