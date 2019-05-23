---
permalink: /docs/index.html
---
# Karaoke Forever

- [Requirements](#requirements)
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
  - [Supported File Formats](#supported-file-formats)
  - [MetaParser](#metaparser)
    - [Configuring the Parser](#configuring-the-parser)
    - [Creating a Parser (Experimental)](#creating-a-parser-experimental)
  - [Command Line Options](#command-line-options)
  - [File Locations](#file-locations)
- [F.A.Q.](#faq)
- [Acknowledgements](#acknowledgements)

## Requirements

Karaoke Forever has a few parts:

- **[Server:](#karaoke-forever-server)** Runs on your macOS/Windows/Linux/etc. system to serve the "web" app and [supported media files](#supported-file-formats) on your local network.

- **[Web app:](#karaoke-forever-the-web-app)** Supports all modern browsers, but is designed for mobile screens. Does not support Internet Explorer.

- **[Player:](#player-admin-only)** Runs in a supported browser on the system handling audio/video for a [room](#rooms-admin-only). It's assumed the player's output will be mixed with any microphones (either in software or an outboard mixer)

  The current versions of these browsers are supported:

  - Chrome/Chromium/Edge
  - Firefox

  Results may vary in other browsers depending on their support for [WebGL 2.0](https://caniuse.com/#feat=webgl2) and [Web Audio](https://caniuse.com/#feat=audio-api).

**Note:** Karaoke Forever does not handle audio *input* and assumes the player's output will be mixed with any microphones (either in software or an outboard mixer)

## Quick Start

1. Install and run Karaoke Forever Server on the system that will serve the web app on your local network. On macOS or Windows, Karaoke Forever Server runs in the menu bar or tray.

  **Important:** *The packaged app is not currently signed, so macOS Gatekeeper and Windows SmartScreen will likely complain by default. On macOS, *do not disable Gatekeeper*, simply right-click the .app and choose Open.*

2. Browse to the server URL. You can copy or open the URL in your default browser using the Karaoke Forever Server menu bar/tray icon.

  ***Note:*** *The web app is designed for mobile browsers, so try switching to your phone to get an idea of what users will see.*

3. Create your admin account at the welcome page.

4. In the Preferences panel, tap Media Folders and add your [supported media](#supported-file-formats).

5. When the media scan finishes, tap the [library](#library) icon. To queue  songs, tap to expand an artist, then tap a song.

6. If you are not on the system that will be running the [player](#player-admin-only) go there now, browse to the server URL and sign in with your admin account.

7. You should see a notice at the top that no players are present, so tap the Start Player link. (If you don't see a notice, your current browser doesn't support fullscreen mode)

8. Click Play in the playback controls that appear at the top. The current singer will temporarily have access to these while it's their turn. Admins always have access to the playback controls.

## Karaoke Forever (the web app)

### Library

The library view lists available songs organized by artist, and allows users to search songs by artist and title.

Tapping a song's title will add it to the queue, and tapping its star will favorite it. Admins can reveal additional options for each song, such as Get Info, by swiping left on the song.

As an admin, you may see songs with an italicized number at the end, like *(2)*. That means there are two versions (media files) of the same song. The version in the folder with the highest priority will be queued when tapped (see Media Folders in [Preferences](#preferences-admin-only)).

### Queue

The queue view shows the current, upcoming and previously played songs.

Karaoke Forever tries to distribute users as evenly as possible and prioritizes the queue based on the amount of time since each user last sang. This means users that join later in the session won't be stuck at the back of a long queue.

To remove an upcoming song, swipe left and tap the remove button. Non-admin users can only remove their own songs. Admins also see additional options when swiping left.

### Account

The account view lets users manage their account and admins manage the server app.

#### Rooms (Admin Only)

The Rooms panel allows admins to create, edit and remove rooms.

Karaoke Forever uses "rooms" to organize sessions by space and time (spacetime?) Every room has its own song queue, and can be either open or closed. Users choose a room when they sign in.

**Warning:** Removing a room will also remove its queue, so the history of songs played during that session will be lost.

**Note:** Closing a room does not sign out users currently in it; only new sign-ins will be prevented.

#### Preferences (Admin Only)

The Preferences panel allows admins to configure [Karaoke Forever Server](#karaoke-forever-server).

- **Media Folders:** Add folders with [supported media files](#supported-file-formats) to scan them into the library. When multiple folders contain a version of the same song, the version in the folder highest in the list will be used. Karaoke Forever Server does not automatically detect changes to media folders; click Refresh to re-scan.

#### My Account

This panel lets users change their name, username or password and sign out.

### Player (admin only)

The player is a part of the web app designed to run in fullscreen mode on the system handling audio/video for a room.

To start the player, sign in as an admin to a [room](#rooms-admin-only) using a browser that supports fullscreen mode. If no player is currently in the room, a notice will appear with a link to start the player. If you don't see a notice, your browser doesn't support fullscreen mode (but you can still manually navigate to `/player`).

## Karaoke Forever Server

### Installation

**Important:** The packaged app is not currently signed, so macOS Gatekeeper and Windows SmartScreen will likely complain by default. On macOS, *do not disable Gatekeeper*, simply right-click the .app and choose Open.

You can also run the server on most any platform with Node.js 12:

1. Clone the project repository
2. `npm install`
3. `npm run compile`
4. `npm run serve` and look for "Web server running at" for the **server URL**

### Supported File Formats

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) (CD+Graphics and MP3 audio in separate files)

  The .cdg and .mp3 files must have the same name. Karaoke Forever will also look for an .m4a audio file and use it instead if present.

- MP4 (video with audio)

  Note that since mp4/m4a files are only containers, codec support can vary depending on the browser running the [player](#player-admin-only).

When determining the artist name and song title for each media file, the default behavior is to use the filename, assumed to be in the format "Artist - Title". This can be configured per-folder (see [MetaParser](#metaparser)).

Media files that couldn't be added to the library are [logged to a file](#file-locations). To change the level of logging, see [Command Line Options](#command-line-options).

### MetaParser

Karaoke Forever expects media filenames to be in the format "Artist - Title" by default, but the parser can be configured on a per-folder basis using a `_kfconfig.js` file. When a `_kfconfig.js` file is encountered in a folder it applies to all files and subfolders within. If any subfolders have their own `_kfconfig.js` files, those take precedence.

#### Configuring the Parser

You can configure the default parser by returning an object with the options you want to override. For example, if a folder has filenames in the format "Title - Artist" instead, you could add this `_kfconfig.js` file:

```js
return {
  artistOnLeft: false, // override default
}
```

**Note:** It's important to `return` the configuration object. JSON format is not currently supported.

The default configuration is as follows:

```js
return {
  articles: ['A', 'An', 'The'], // false will disable article normalization
  artistOnLeft: true,
  separator: '-',
}
```

#### Creating a Parser (Experimental)

Your `_kfconfig.js` can also return a *parser creator* instead of a configuration object. A parser creator returns a function (parser) that Karaoke Forever can call for each media file. The [default parser](https://github.com/bhj/karaoke-forever/blob/master/server/Scanner/MetaParser/defaultMiddleware.js) is still available so you don't have to reinvent the wheel.

The following example creates a parser that removes the word 'junk' from each filename before handing off to the default parser:

```js
return ({ compose, getDefaultParser, defaultMiddleware }) => {
  function customMiddleware (ctx, next) {
    ctx.name = ctx.name.replace('junk', '')
    next()
  }

  return compose(
    customMiddleware,   // our custom pre-processing
    getDefaultParser(), // then the default parser (optionally accepts a configuration object)
  )
}

```

Your parser creator is passed an object with the following properties:

- `compose` (function) accepts functions (or arrays of functions) as arguments and returns a single composed function that can be used as a parser
- `getDefaultParser` (function) gets an instance of the default parser, which itself can be used as middleware. Note that the method must be called because you can optionally pass a [configuration object](#configuring-the-parser) when getting an instance
- `defaultMiddleware` [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) containing the [default middleware](https://github.com/bhj/karaoke-forever/blob/master/server/Scanner/MetaParser/defaultMiddleware.js) in order. This can be used to recompose the middleware in your custom parser

When Karaoke Forever scans a media file, it calls the parser with a context object `ctx` having the following properties:

- `dir` (string) full path of the containing folder
- `dirSep` (string) path segment separator used by the current OS (`/` or `\`)
- `name` (string) media filename (without extension)
- `tags` (object) media file's [tags/metadata fields](https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md)

Middleware may mutate `ctx` as required. Once finished, the following properties on it will be used:

- `artist` (string) artist's name as it will be shown in the library
- `title` (string) song's title as it will be shown in the library
- `artistNorm` (string) normalized version of the artist's name; used for matching and sorting (defaults to `artist` if not set)
- `titleNorm` (string) normalized version of the song's title; used for matching and sorting (defaults to `title` if not set)

It's important that each middleware calls `next` unless you don't want the chain to continue (for instance, if you've set `artist` and `title` manually and want to use them as-is).

**Note:** Media duration is handled automatically and cannot be set from a parser.

### Command Line Options

Karaoke Forever Server supports the following command line options:

| Option | Description | Default |
| --- | --- | --- |
| <span style="white-space: nowrap;">`-l, --loglevel <number>`</span>| Log file level (**0**=off, **1**=error, **2**=warn, **3**=info, **4**=verbose, **5**=debug) | 2 |
| <span style="white-space: nowrap;">`-p, --port <number>`</span>| Web server port. To use low ports such as 80 you may need to run the app with elevated privileges (not recommended) | 0 (auto) |
| <span style="white-space: nowrap;">`--version`</span>| Output the Karaoke Forever Server version and exit | |

### File Locations

#### macOS

 - Database: `~/Library/Application Support/Karaoke Forever Server/database.sqlite3`
 - Media Scanner Log: `~/Library/Logs/Karaoke Forever Server/scanner.log`
 - Server Log: `~/Library/Logs/Karaoke Forever Server/server.log`

#### Windows

- Database: `%APPDATA%\Karaoke Forever Server\database.sqlite3`
- Media Scanner Log: `%APPDATA%\Karaoke Forever Server\scanner.log`
- Server Log: `%APPDATA%\Karaoke Forever Server\server.log`

## F.A.Q.

#### Where can I get karaoke songs?

Below is a non-exhaustive list of sources for downloadable MP4 or MP3+G files:

- [SunFly Karaoke](https://www.sunflykaraoke.com)
- [PartyTyme Karaoke](https://www.partytyme.net)
- [Karaoke Version](https://www.karaoke-version.com)
- [All Star Karaoke](https://www.allstardl.com)
- [SBI Karaoke](https://downloads.sbikaraoke.com)
- [PCDJ](https://www.pcdj.com/hd-mp4-karaoke-download-packs/)

#### Is a microphone required?

No, Karaoke Forever makes no assumptions regarding audio input. There are many options for mixing the player's output with microphones (either in software or an outboard mixer)

## Acknowledgements

- [David Zukowski](https://zuko.me): react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
- [Luke Tucker](https://github.com/ltucker/): The original CD+Graphics player
- Carter Corker: The magic of [babel-plugin-react-css-modules](https://github.com/gajus/babel-plugin-react-css-modules)
- Stuart Albert: The name (a reference to Duke Nukem Forever, given the almost vaporware status)
- B&W mic icon by [Freepik](http://www.freepik.com/) from [flaticon.com](http://www.flaticon.com/)
