---
permalink: /docs/
title: Documentation
---
# Documentation

## Quick Start

1. <a href="{{ site.github.releases_url }}">Download</a><svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> and install [Karaoke Forever Server](#karaoke-forever-server) on the system that will serve the app and media on your local network.

2. Browse to the server URL. You can copy or open the URL in your default browser using the Karaoke Forever Server menu bar or tray icon (macOS or Windows only).

    <aside class="info">
      <svg class="icon" viewBox="0 0 24 24">
        <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
      </svg>
      <p>The app is primarily designed for mobile, so you may want to switch to your phone at this point.</p>
    </aside>

3. Create your admin account at the welcome page.

4. In the Preferences panel, tap Media Folders and add your [supported media files](#supported-media).

5. When the media scan is finished, the new songs will appear in the [library](#library) view. Queue a few songs by tapping an artist's name, then tapping a song title.

6. If you are not on the system that will be running the [player](#player-admin-only) go there now, browse to the server URL and sign in with your admin account.

7. You should see a notice at the top that no players are present, so tap the Start Player link. (If you don't see a notice, your current browser doesn't support fullscreen mode)

8. Click Play in the playback controls that appear at the top. The current singer will temporarily have access to these while it's their turn. Admins always have access to the playback controls.

You are now ready to party!

<hr>

## Karaoke Forever

Karaoke Forever is a modern mobile browser app that lets people quickly and easily join and start singing without having to install anything on their phone. It's built for small screens and touch, but a mouse is supported in desktop browsers (click and drag to emulate a swipe gesture).

### Library

The library view lists available songs organized by artist. The search/filter area at the top allows searching by artist name and song title, and/or showing only favorited songs.

Tap an artist to reveal their songs, then tap the song title to add it to the queue, or tap its star to favorite it.

Admins can reveal additional options for each song, such as Get Info, by swiping left on the song. As an admin you may see songs with an italicized number at the end, like *(2)*. That means there are two versions (media files) of the same song. The version in the folder highest in the [Media Folders](#preferences-admin-only) list will be queued by default (see Media Folders in [Preferences](#preferences-admin-only)).

### Queue

The queue view shows the current, upcoming and previously played songs.

Karaoke Forever tries to distribute singers as fairly as possible by prioritizing the queue based on the amount of time since each user last sang. This also means users joining later in the session won't be stuck at the back of a long queue.

To remove an upcoming song, swipe left and tap the remove button. Non-admin users can only remove their own songs. Admins also see additional options when swiping left.

### Account

The account view lets users manage their account; admins will see additional panels.

#### Rooms (admin only)

The Rooms panel allows admins to create, edit or remove rooms.

Karaoke Forever uses "rooms" to organize sessions by time and space (spacetime?) Each room gets its own song queue and player, and can have one of the following statuses:

  - `open` The room can be entered and have songs queued. Users choose an open room when signing in.
  - `closed` The room can no longer be entered and no more songs can be queued, but current occupants are not kicked out and can play through the queue.

It's best to create a new room before each session so that you start with an empty queue, then set the room to `closed` when finished.

<aside class="warn">
  <svg class="icon" viewBox="0 0 24 24">
    <path d="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16"/>
  </svg>
  <p>Removing a room will also remove its queue, so the history of songs played during that session will be lost.</p>
</aside>

#### Preferences (admin only)

The Preferences panel allows admins to configure [Karaoke Forever Server](#karaoke-forever-server).

- **Media Folders:** Add folders with [supported media files](#supported-media) to scan them into the library. When multiple folders contain a version of the same song, the version in the folder highest in the list will be used. Karaoke Forever Server does not automatically detect changes to media folders; click Refresh to re-scan.

#### My Account

This panel lets users change their name, username or password and sign out.

### Player (admin only)

The player view is a part of the browser app that's designed to run fullscreen on the system handling audio/video for a room. The latest versions of these browsers are currently supported:

  - Firefox
  - Chrome/Chromium/Edge

To start a player, sign in as an admin to the desired room and a notice will appear with a link to start the player. If you don't see a notice, your browser doesn't support fullscreen mode or there is already another player detected in the room (you can still manually navigate to `/player`).

<hr>

## Karaoke Forever Server

The server software hosts the app and your media files on your local network (it is not designed to be run as a service exposed to the Internet). Built on Node.js and SQLite, it can run on relatively minimal hardware (Raspberry Pi 3B+).

### Installation

#### macOS or Windows

<a href="{{ site.github.releases_url }}">Download</a><svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> and install the latest release. Karaoke Forever Server runs in the menu bar or tray:

<div class="row">
  <figure>
    <img src="/assets/images/kfs_mac.png" alt="Karaoke Forever Server (macOS)" />
    <figcaption>macOS</figcaption>
  </figure>

  <figure>
    <img src="/assets/images/kfs_win.png" alt="Karaoke Forever Server (Windows)" />
    <figcaption>Windows</figcaption>
  </figure>
</div>

<aside class="info">
  <svg class="icon" viewBox="0 0 24 24">
    <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
  </svg>
  <p>Beta versions of Karaoke Forever Server are not currently signed, so macOS Gatekeeper and Windows SmartScreen will likely complain by default. On macOS, <strong>do not disable Gatekeeper</strong>, just right-click <code>Karaoke Forever Server.app</code> in your Applications folder and choose Open.</p>
</aside>

#### Other Platforms

You can also install and run the server on most any platform with [Node.js](https://nodejs.org)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> v12 or later:

1. Clone the <a href="{{ site.github.repository_url }}">project repository</a><svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
2. `npm install`
3. `npm run build` (this runs Webpack to compile the front-end app)
4. `npm run serve` and look for "Web server running at" for the **server URL**

See [Quick Start](#quick-start) for more information on first-time setup once the server is installed and running.

### Supported Media

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> (the .cdg and .mp3 files must have the same name;  Karaoke Forever will also look for an .m4a audio file and use it instead if present)

- MP4 (since mp4/m4a files are only containers, codec support can vary depending on the browser running the [player](#player-admin-only))

Karaoke Forever expects media filenames to be in the format "Artist - Title" (see [MetaParser](#metaparser) for more info). By default, media files that couldn't be parsed are [logged to a file](#file-locations) (to change the level of logging, see [Command Line Options](#command-line-options)).

### MetaParser

When determining the artist name and song title for each media file, the default behavior is to use the filename, assumed to be in the format "Artist - Title". This can be configured per-folder using a `_kfconfig.js` file. When a `_kfconfig.js` file is encountered in a folder it applies to all files and subfolders within. If any subfolders have their own `_kfconfig.js` files those will take precedence.

#### Configuring the Parser

You can configure the default parser by returning an object with the options you want to override. For example, if a folder has filenames in the format "Title - Artist" instead, you could add this `_kfconfig.js` file:

```js
return {
  artistOnLeft: false, // override default
}
```

<aside class="info">
  <svg class="icon" viewBox="0 0 24 24">
    <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
  </svg>
  <p>It's important to `return` the configuration object. JSON format is not currently supported.</p>
</aside>

The default configuration is:

```js
return {
  articles: ['A', 'An', 'The'], // false will disable article normalization
  artistOnLeft: true,
  separator: '-',
}
```

#### Creating a Parser (Experimental)

Your `_kfconfig.js` can also return a *parser creator* instead of a configuration object. A parser creator returns a function (parser) that Karaoke Forever can call for each media file. The [default parser](https://github.com/bhj/karaoke-forever/blob/master/server/Scanner/MetaParser/defaultMiddleware.js)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> is still available so you don't have to reinvent the wheel.

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
- `defaultMiddleware` [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> containing the [default middleware](https://github.com/bhj/karaoke-forever/blob/master/server/Scanner/MetaParser/defaultMiddleware.js)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> in order. This can be used to recompose the middleware in your custom parser

When Karaoke Forever scans a media file, it calls the parser with a context object `ctx` having the following properties:

- `dir` (string) full path of the containing folder
- `dirSep` (string) path segment separator used by the current OS (`/` or `\`)
- `name` (string) media filename (without extension)
- `tags` (object) media file's [tags/metadata fields](https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>

Middleware may mutate `ctx` as required. Once finished, the following properties on it will be used:

- `artist` (string) artist's name as it will be shown in the library
- `title` (string) song's title as it will be shown in the library
- `artistNorm` (string) normalized version of the artist's name; used for matching and sorting (defaults to `artist` if not set)
- `titleNorm` (string) normalized version of the song's title; used for matching and sorting (defaults to `title` if not set)

It's important that each middleware calls `next` unless you don't want the chain to continue (for instance, if you've set `artist` and `title` manually and want to use them as-is).

<aside class="info">
  <svg class="icon" viewBox="0 0 24 24">
    <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
  </svg>
  <p>Media duration is handled automatically and cannot be set from a parser.</p>
</aside>

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

<hr>

## Acknowledgements

- [David Zukowski](https://zuko.me)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>: react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
- [Luke Tucker](https://github.com/ltucker/)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>: the original JavaScript CD+Graphics implementation
- Kuanyu Chen: (in)sanity testing on Windows
- Carter Corker: pointing out [babel-plugin-react-css-modules](https://github.com/gajus/babel-plugin-react-css-modules)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> is totally a thing
- Stuart Albert: the name, originally a reference to Duke Nukem Forever, given the development time and almost vaporware status
- B&W mic icon by [Freepik](http://www.freepik.com/)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> from [flaticon.com](http://www.flaticon.com/)<svg class="icon external" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
