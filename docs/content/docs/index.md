---
title: Documentation
resources:
- src: 'app-library.png'
  params:
    galleryOrder: 1
- src: 'app-queue.png'
  params:
    galleryOrder: 2
- src: 'app-account.png'
  params:
    galleryOrder: 3
- src: 'app-displayctrl.png'
  params:
    galleryOrder: 4
- src: 'app-player.jpg'
  params:
    galleryOrder: 5
---

## Quick Start

1. Install and run [Karaoke Eternal Server](#karaoke-eternal-server) on the system that will serve the app and media on your local network.

2. Browse to the [app](#karaoke-eternal-the-app) at the **server URL**. You can copy the URL or open it in your default browser using the Karaoke Eternal Server menu bar or tray icon in macOS or Windows.

<aside class="info">
  {{% icon-info %}}
  <p>Since the app is designed for mobile, use your phone for the best experience.</p>
</aside>

3. Create your **admin** account at the welcome page.

4. In the Preferences panel, tap Media Folders and add your [supported media](#media-files).

5. Once the media scanner finishes, head to the [library](#library) and add some songs by tapping an artist, then tapping a song title. A glowing song means it's upcoming in the queue.

6. Now we just need a [player](#player). On the system that will output the room's audio/video, browse to the **server URL**, sign in with your admin account, and tap the **Start Player** link at the top. If you don't see a link, your current browser doesn't support fullscreen mode, but you can still navigate to `/player`.

7. Playback and display controls will appear on all your devices now that there's a player in the room. The current singer sees these during their turn; admins always see these.

Congratulations, you are now ready to press play and party!

<hr>

## Karaoke Eternal (the "web" app)

Karaoke Eternal is a modern mobile browser app that lets everyone join quickly, without having to install anything on their phones. It's built for touch, but a mouse is supported in desktop browsers (click and drag to emulate swipe gestures).

### Library

The library view lists available songs organized by artist. The search area at the top allows filtering by artist name, song title and/or your starred songs:

<div class="row">
  {{% img srcset="app-library.png 2x" src="app-library.png" alt="Library view" %}}
  {{% img srcset="app-library2.png 2x" src="app-library2.png" alt="Library search/filter view" %}}
</div>

Tap to expand an artist, then tap a song's title to queue it. You can also tap its star to save it for later. A glowing song indicates that it's upcoming in the queue. Artists will also glow to show that they contain queued or starred songs.

If there are multiple versions (media files) of a song, admins will see an italicized number in parentheses after the title, and the version in the folder highest in the [Media Folders](#preferences-admin-only) list will be used by default. Admins can also reveal additional options for a song, such as Get Info, by swiping left on it.

### Queue

The queue view shows your room's previous, current and upcoming songs:

<div class="row">
  {{% img srcset="app-queue.png 2x" src="app-queue.png" alt="Queue view" %}}
</div>

Singers are prioritized by time since each last sang, so those joining later in the session aren't penalized and will get right to the front of the queue.

To remove an upcoming song, swipe left and tap X. Normal users can only remove their own songs, but admins can remove anyone's upcoming song. Admins will also see additional options when swiping left, such as Get Info.

### Account

The account view lets users manage their account, while admins will see additional panels:

<div class="row">
  {{% img srcset="app-account.png 2x" src="app-account.png" alt="Account view" %}}
</div>

#### Rooms (admin only)

The Rooms panel allows admins to create, edit or remove rooms.

Karaoke Eternal uses "rooms" to organize sessions by time and space (spacetime?) Users choose an open room when signing in, and each room has its own queue.

Rooms can have one of the following statuses:

  - `open` Can be signed in to and have songs queued.
  - `closed` Can no longer be signed in to or have more songs queued. When closing, current occupants are unaffected and can continue playing through the existing queue.

It's best to create a new room before each session so that you start with an empty queue, then set the room to `closed` when finished.

<aside class="warn">
  {{% icon-warn %}}
  <p>Removing a room will also remove its queue, so the history of songs played during that session will be lost.</p>
</aside>

#### Preferences (admin only)

The Preferences panel allows admins to set these global preferences:

- **Media Folders**
  - Add folders with [supported media files](#media-files) to scan them into the library. You can re-arrange the folder order by dragging and dropping, and when songs have multiple versions the one in the folder highest in the list will be used.
- **Player**
  - **ReplayGain (clip-safe)**: [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain){{% icon-external %}} metadata tags allow the player to automatically minimize volume differences between songs, resulting in a better experience for all, and without affecting the dynamic range of each song (no compression). This option should generally only be enabled when you know all of your media is properly tagged. It normally reduces the player's overall volume significantly, so just turn your output up, and/or your mics down.

#### My Account

The My Account panel allows users to change their username, password, display name or picture as well as sign out.

### Player

The player is a part of the [app](#karaoke-eternal-the-app) that's designed to run fullscreen on the system handling audio/video for a [room](#rooms-admin-only). The latest versions of these browsers are officially supported:

  - Firefox
  - Chromium/Chrome/Edge

<div class="row">
  {{% img srcset="app-player.jpg 2x" src="app-player.jpg" alt="Player view" %}}
  {{% img srcset="app-displayctrl.png 2x" src="app-displayctrl.png" alt="Display options" %}}
</div>

To start a player, sign in to the desired room as an admin and a player link will appear at the top. If you don't see a link that means fullscreen support wasn't detected, but you can still manually navigate to `/player`.

Once a player is in the room, playback and display controls appear at the top of the app for the currently-up singer as well as admins, who always have access to these.

<hr>

## Karaoke Eternal Server

The server hosts the app and your media files, and can run on relatively minimal hardware (Raspberry Pi 3B+). [Player(s)](#player) don't need to be on the same system as the server.

<aside class="info">
  {{% icon-info %}}
  <p>The server chooses a random port at each startup unless otherwise <a href="#cli--env">specified</a>.</p>
</aside>

### Installation

#### macOS or Windows

<a href="{{% baseurl %}}download">Download</a>{{% icon-external %}} and install the latest release. Karaoke Eternal Server runs in the menu bar or tray:

<div class="row">
  {{< img src="server-macos.png" alt="Karaoke Eternal Server (macOS)" caption="macOS" >}}
  {{< img src="server-windows.png" alt="Karaoke Eternal Server (Windows)" caption="Windows" >}}
</div>

<aside class="info">
  {{% icon-info %}}
  <p>Beta versions of Karaoke Eternal Server are not currently signed, so macOS Gatekeeper and Windows SmartScreen will likely complain. On macOS, <strong>do not disable Gatekeeper</strong>, simply right-click <code>Karaoke Eternal Server.app</code> in your Applications folder and choose Open. On Windows, click More Info and then Run Anyway.</p>
</aside>

#### Any OS with Node.js

Karaoke Eternal Server requires [Node.js](https://nodejs.org){{% icon-external %}} 12 or later.

1. Install via ```npm```

{{< highlight shell >}}
  $ npm i -g karaoke-eternal
{{< /highlight >}}

<aside class="info">
  {{% icon-info %}}
  <p>Depending on availability of pre-built modules (specifically SQLite and bcrypt) for your architecture, compilation tools may need to be present (see the requirements for <a href="https://github.com/nodejs/node-gyp#installation">node-gyp</a>)</p>
</aside>

2. Start the server

{{< highlight shell >}}
  $ karaoke-eternal-server
{{< /highlight >}}

3. Watch the output for "Web server running at..." and browse to the **server URL**

### Media Files

The following types are supported:

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG){{% icon-external %}} (.cdg and .mp3 files must be named the same; also supports an .m4a instead of .mp3). Supports background visualizations.

- MP4 video (codec support can vary depending on the browser running the [player](#player)). Does not support background visualizations (videos are played as-is).

Media filenames are expected to be in "Artist - Title" format by default, but this can be configured per-folder using a `_keconfig.js` file. When this file is encountered in a folder it applies to all files and subfolders. If any subfolders have their own `_keconfig.js`, that will take precedence.

Media with filenames that couldn't be parsed are [logged to a file](#file-locations) (to change the level of logging, see [Command Line Options](#cli--env)) and won't appear in the library view.

#### Configuring the Metadata Parser

You can configure the default metadata parser by returning an object with the options you want to override. For example, if a folder has filenames in the format "Title - Artist" instead, you could add this `_keconfig.js` file:

{{< highlight js >}}
return {
  artistOnLeft: false, // override default
}
{{< /highlight >}}

<aside class="info">
  {{% icon-info %}}
  <p>It's important to `return` the configuration object. JSON format is not currently supported.</p>
</aside>

The default configuration is:

{{< highlight js >}}
return {
  articles: ['A', 'An', 'The'], // false disables article normalization
  artistOnLeft: true,
  delimiter: '-', // can also be a RegExp
}
{{< /highlight >}}

#### Creating a Metadata Parser (Experimental)

Your `_keconfig.js` can also return a *parser creator* instead of a configuration object. A parser creator returns a function that can be called for each media file. The [default parser](/repo/blob/master/server/Scanner/MetaParser/defaultMiddleware.js){{% icon-external %}} is still available so you don't have to reinvent the wheel.

The following example creates a parser that removes the word 'junk' from each filename before handing off to the default parser:

{{< highlight js >}}
return ({ compose, getDefaultParser, defaultMiddleware }) => {
  function customMiddleware (ctx, next) {
    ctx.name = ctx.name.replace('junk', '')
    next()
  }

  return compose(
    customMiddleware,   // our custom pre-processing
    getDefaultParser(), // everything else (optionally accepts a configuration object)
  )
}
{{< /highlight >}}

Your parser creator is passed an object with the following properties:

- `compose` (function) accepts functions (or arrays of functions) as arguments and returns a single composed function that can be used as a parser
- `getDefaultParser` (function) gets an instance of the default parser, which itself can be used as middleware. Note that the method must be called because you can optionally pass a [configuration object](#configuring-the-metadata-parser) when getting an instance
- `defaultMiddleware` [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map){{% icon-external %}} containing the [default middleware](/repo/blob/master/server/Scanner/MetaParser/defaultMiddleware.js){{% icon-external %}} in order. This can be used to recompose the middleware in your custom parser

When a media file is scanned, the parser is called with a context object `ctx` having the following properties:

- `dir` (string) full path of the containing folder
- `dirSep` (string) path segment separator used by the current OS (`/` or `\`)
- `name` (string) media filename (without extension)
- `tags` (object) media file's [tags/metadata fields](https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md){{% icon-external %}}

Middleware may mutate `ctx` as required. Once finished, the following properties on it will be used:

- `artist` (string) artist's name as it will be shown in the library
- `artistNorm` (string) normalized version of the artist's name; used for matching and sorting (`artist` if not set)
- `title` (string) song's title as it will be shown in the library
- `titleNorm` (string) normalized version of the song's title; used for matching and sorting (`title` if not set)

It's important that each middleware calls `next` unless you don't want the chain to continue (for instance, if you've set `artist` and `title` manually and want to use them as-is).

<aside class="info">
  {{% icon-info %}}
  <p>Media duration is handled automatically and cannot be set from a parser.</p>
</aside>

### CLI & ENV

Karaoke Eternal Server supports the following Command Line Options and Environment Variables. Those accepting a numeric level use the following: **0**=off, **1**=error, **2**=warn, **3**=info, **4**=verbose, **5**=debug

| Option | ENV | Description | Default |
| --- | --- | --- | --- |
| <span style="white-space: nowrap;">`--consoleLevel <number>`</span>| <span style="white-space: nowrap;">`KES_CONSOLE_LEVEL`</span> | Web server console output level | 4 |
| <span style="white-space: nowrap;">`--data <string>`</span>| <span style="white-space: nowrap;">`KES_PATH_DATA`</span> | Absolute path for database files | |
| <span style="white-space: nowrap;">`--logLevel <number>`</span>| <span style="white-space: nowrap;">`KES_LOG_LEVEL`</span> | Web server log file level | 3 |
| <span style="white-space: nowrap;">`-p, --port <number>`</span>| <span style="white-space: nowrap;">`KES_PORT`</span> | Web server port | auto |
| <span style="white-space: nowrap;">`--rotateKey`</span>| <span style="white-space: nowrap;">`KES_ROTATE_KEY`</span> | Rotate the session key at startup | |
| <span style="white-space: nowrap;">`--scan`</span>| <span style="white-space: nowrap;">`KES_SCAN`</span> | Run the media scanner at startup | |
| <span style="white-space: nowrap;">`--scanConsoleLevel <number>`</span>| `KES_SCAN_CONSOLE_LEVEL` | Media scanner console output level (default=4) | 4 |
| <span style="white-space: nowrap;">`--scanLogLevel <number>`</span>| <span style="white-space: nowrap;">`KES_SCAN_LOG_LEVEL`</span> | Media scanner log file level | 3 |
| <span style="white-space: nowrap;">`--urlPath <string>`</span>| <span style="white-space: nowrap;">`KES_URL_PATH`</span> | Web server base URL path (must begin with a forward slash) | / |
| <span style="white-space: nowrap;">`-v, --version`</span>| | Show version and exit | |

### File Locations

#### macOS

 - Database: `~/Library/Application Support/Karaoke Eternal Server/database.sqlite3`
 - Media Scanner Log: `~/Library/Logs/Karaoke Eternal Server/scanner.log`
 - Server Log: `~/Library/Logs/Karaoke Eternal Server/server.log`

#### Windows

- Database: `%APPDATA%\Karaoke Eternal Server\database.sqlite3`
- Media Scanner Log: `%APPDATA%\Karaoke Eternal Server\scanner.log`
- Server Log: `%APPDATA%\Karaoke Eternal Server\server.log`

<hr>

## Acknowledgements

- [David Zukowski](https://zuko.me){{% icon-external %}}: react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
- [Luke Tucker](https://github.com/ltucker/){{% icon-external %}}: the original JavaScript CD+Graphics implementation
- B&W mic icon by [Freepik](https://www.freepik.com/){{% icon-external %}} from [flaticon.com](https://www.flaticon.com/){{% icon-external %}}
