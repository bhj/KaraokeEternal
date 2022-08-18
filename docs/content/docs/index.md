---
title: Documentation
description: Documentation for Karaoke Eternal (the app) and Karaoke Eternal Server
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

## Karaoke Eternal (the app)

Karaoke Eternal is a modern mobile browser app that lets everyone join without having to install anything on their phones. It's built for touch, but a mouse is supported in desktop browsers (click and drag to emulate swipe gestures).

### Library

The library view lists available songs organized by artist, with search and filtering options at the top.

<div class="row">
  {{% img "app-library.png" "Library view" %}}
  {{% img "app-library2.png" "Library search/filter view" %}}
</div>

Tap to expand an artist, then tap a song's title to queue it. A glowing song and artist indicate they're upcoming in the queue.

Swiping left on a song reveals the following options:

  - Song Info (admin only): Shows underlying media and allows setting a preferred version.

When a song has multiple versions (media files), admins see an italicized number after the title, and media in the folder highest in the [Media Folders](#preferences-admin-only) list will be used unless specifically set (see Song Info above).

### Queue

The queue view shows your room's previous, current and upcoming songs.

<div class="row">
  {{% img "app-queue.png" "Queue view" %}}
</div>

Karaoke Eternal automatically arranges the queue using a round-robin method for fairness, without penalizing those joining later in the party. For example, a latecomer will be able to sing right after the next-up singer regardless of how long the queue is.

Swiping left on a queued song reveals the following options:

- Make User's Next: Moves the song to become the next one that user sings. Does *not* affect that user's place in the queue.
- Song Info (admin only): Shows underlying media and allows setting a preferred version.
- Remove: Removes the song from the queue.

Normal users can only manage their own queued songs, but admins can manage anyone's.

### Account

The account view lets users manage their account, while admins will see additional panels.

<div class="row">
  {{% img "app-account.png" "Account view" %}}
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
  {{% img "app-player.jpg" "Player view" %}}
  {{% img "app-displayctrl.png" "Display options" %}}
</div>

To start a player, sign in to the desired room as an admin and a player link will appear at the top. If you don't see a link that means fullscreen support wasn't detected, but you can still manually navigate to `/player`.

Once a player is in the room, playback and display controls will appear. Admins always see these, as well as the current singer during their turn.

<aside class="info">
  {{% icon-info %}}
  <p>Starting playback inside the player (rather than on a remote device) helps avoid browser auto-play restrictions. These can also be disabled.</p>
</aside>

<hr>

## Karaoke Eternal Server

The server hosts the app and your media files, and can run on relatively minimal hardware (Raspberry Pi 3B+). Note that [players](#player) don't need to run on the same system as the server.

### Installation

#### macOS or Windows

<a href="{{% baseurl %}}download">Download</a>{{% icon-external %}} and install the latest release. Karaoke Eternal Server runs in the menu bar or tray:

<div class="row">
  {{< img "server-macos.png" "Karaoke Eternal Server (macOS)" "1x">}}
  {{< img "server-windows.png" "Karaoke Eternal Server (Windows)" "1x">}}
</div>

<aside class="info">
  {{% icon-info %}}
  <p>These packages are not currently signed. On macOS, <strong>do not</strong> disable Gatekeeper; simply right-click <code>Karaoke Eternal Server.app</code> in your Applications folder and choose Open. On Windows, click More Info and then Run Anyway.</p>
</aside>

<aside class="info">
  {{% icon-info %}}
  <p>The server chooses a random port at startup unless <a href="#cli--env">otherwise specified</a>.</p>
</aside>

See [Quick Start](#quick-start) if you're new to Karaoke Eternal.

#### Docker (Synology)

1. In the Registry section of DSM's Docker package, search for and download the `radrootllc/karaoke-eternal` image.
2. In the Image section, double-click to launch the image.
3. The container creation dialog has the following sections:
  - **Network**
    - No changes (click Next)
  - **General**
    - `Enable auto-restart` (if desired)
  - **Port Settings**
    - Set the Local Port to `8080` (or something else if desired)
  - **Volume Settings**
    - Click Add Folder, select `docker` and create a new `karaoke-eternal` subfolder. Select that subfolder and click Select, then enter the mount path `/config`. This path is used to store the database.
    - Click Add Folder, and this time select your media folder(s). For their mount paths, enter something easy like `/mnt/karaoke`, etc. Once inside the app, you'll add these mount paths as [Media Folders](#preferences-admin-only).
4. Click Done. Karaoke Eternal Server should now be running and reachable at `http://<your_synology_ip>:8080`. See [Quick Start](#quick-start) if you're new to Karaoke Eternal.

#### Docker (CLI and docker-compose)

The [Karaoke Eternal docker image](https://hub.docker.com/r/radrootllc/karaoke-eternal) supports `amd64`, `arm64` and `arm/v7`. The image is modeled after [LinuxServer's](https://docs.linuxserver.io/general/running-our-containers):

  - `/config` should be mapped to a host volume (the database will be stored here)
  - media folder(s) should be mapped to host volume(s) (once inside the app, you'll add these as [Media Folders](#preferences-admin-only))
  - port `8080` should be published to the desired host port
  - `PUID`, `PGID` and `TZ` are optional

Example CLI usage:

{{< highlight shell >}}
  $ docker run \
    --name=karaoke-eternal \
    -v <path_to_database>:/config \
    -v <path_to_media>:/mnt/karaoke \
    -p <host_port>:8080 \
    --restart unless-stopped \
    radrootllc/karaoke-eternal
{{< /highlight >}}  

Example `docker-compose` usage:

{{< highlight yaml >}}
---
version: "2.1"
services:
  karaoke-eternal:
    image: radrootllc/karaoke-eternal
    container_name: karaoke-eternal
    volumes:
      - <path_to_database>:/config
      - <path_to_media>:/mnt/karaoke
    ports:
      - <host_port>:8080
    restart: unless-stopped
{{< /highlight >}}  

See [Quick Start](#quick-start) if you're new to Karaoke Eternal.

#### NPM

Karaoke Eternal is available as an `npm` package for systems running [Node.js](https://nodejs.org){{% icon-external %}} 16 or later.

1. Install via ```npm```

{{< highlight shell >}}
  $ npm i -g karaoke-eternal
{{< /highlight >}}

2. Start the server

{{< highlight shell >}}
  $ karaoke-eternal-server
{{< /highlight >}}

3. Watch the output for "Web server running at..." and browse to the **server URL**. See [Quick Start](#quick-start) if you're new to Karaoke Eternal.

### Media Files

The following types are supported:

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG){{% icon-external %}} (.cdg and .mp3 files must be named the same; also supports an .m4a instead of .mp3)
- MP4 video (codec support can vary depending on the browser running the [player](#player)).

Your media files should be named in **"Artist - Title"** format by default (you can [configure this](#configuring-the-metadata-parser)). Media with filenames that couldn't be parsed won't appear in the library, so check the [scanner log](#file-locations) or console output for these.

#### Configuring the Metadata Parser

The media metadata parser can be customized using a `_kes.v1.js` file. When this file is encountered in a media folder it applies to all files and subfolders (if any subfolders have their own `_kes.v1.js`, it will take precedence).

You can configure the default metadata parser by returning an object with the options you want to override. For example, if a folder has filenames in the format "Title - Artist", you could add this `_kes.v1.js` file:

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

Your `_kes.v1.js` file can also return a *parser creator* instead of a configuration object. A parser creator returns a function that can be called for each media file. The [default parser](/repo/blob/master/server/Scanner/MetaParser/defaultMiddleware.js){{% icon-external %}} is still available so you don't have to reinvent the wheel.

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
- `getDefaultParser` (function) gets an instance of the default parser, which itself can be used as middleware. Note that the method must be called because you can optionally pass a [configuration object](#configuring-the-metadata-parser)
- `defaultMiddleware` [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map){{% icon-external %}} containing the [default middleware](/repo/blob/master/server/Scanner/MetaParser/defaultMiddleware.js){{% icon-external %}} in order. This can be used to recompose the middleware in your custom parser

When a media file is scanned, the parser is called with a context object `ctx` having the following properties:

- `dir` (string) full path of the containing folder
- `dirSep` (string) path segment separator used by the current OS (`/` or `\`)
- `name` (string) media filename (without extension)
- `data` (object) media file's [metadata fields](https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md){{% icon-external %}}

Middleware may mutate `ctx` as required. Once finished, the following properties on it will be used:

- `artist` (string) artist's name as it will be shown in the library
- `artistNorm` (string) normalized version of the artist's name; used for matching and sorting (`artist` if not set)
- `title` (string) song's title as it will be shown in the library
- `titleNorm` (string) normalized version of the song's title; used for matching and sorting (`title` if not set)

It's important that each middleware call `next` unless you're done or don't want the chain to continue.

<aside class="info">
  {{% icon-info %}}
  <p>Media duration is handled automatically and cannot be set from a parser.</p>
</aside>

### CLI & ENV

Karaoke Eternal Server supports the following CLI options and environment variables. The numeric levels used for logs/console are: **0**=off, **1**=error, **2**=warn, **3**=info, **4**=verbose, **5**=debug

| Option | ENV | Description | Default |
| --- | --- | --- | --- |
| <span style="white-space: nowrap;">`--consoleLevel <number>`</span>| <span style="white-space: nowrap;">`KES_CONSOLE_LEVEL`</span> | Web server console output level | 4 |
| <span style="white-space: nowrap;">`--data <string>`</span>| <span style="white-space: nowrap;">`KES_PATH_DATA`</span> | Absolute path of folder for database files | |
| <span style="white-space: nowrap;">`--logLevel <number>`</span>| <span style="white-space: nowrap;">`KES_LOG_LEVEL`</span> | Web server log file level | 3 |
| <span style="white-space: nowrap;">`-p, --port <number>`</span>| <span style="white-space: nowrap;">`KES_PORT`</span> | Web server port | auto |
| <span style="white-space: nowrap;">`--rotateKey`</span>| <span style="white-space: nowrap;">`KES_ROTATE_KEY`</span> | Rotate the session key at startup | |
| <span style="white-space: nowrap;">`--scan`</span>| <span style="white-space: nowrap;">`KES_SCAN`</span> | Run the media scanner at startup | |
| <span style="white-space: nowrap;">`--scanConsoleLevel <number>`</span>| `KES_SCAN_CONSOLE_LEVEL` | Media scanner console output level (default=4) | 4 |
| <span style="white-space: nowrap;">`--scanLogLevel <number>`</span>| <span style="white-space: nowrap;">`KES_SCAN_LOG_LEVEL`</span> | Media scanner log file level | 3 |
| <span style="white-space: nowrap;">`--urlPath <string>`</span>| <span style="white-space: nowrap;">`KES_URL_PATH`</span> | Web server base URL path (must begin with a forward slash) | / |
| <span style="white-space: nowrap;">`-v, --version`</span>| | Show version and exit | |

### File Locations

The default locations for the database (`database.sqlite3`), web server log (`server.log`) and media scanner log (`scanner.log`) are as follows:

#### macOS

 - Database: `~/Library/Application Support/Karaoke Eternal Server`
 - Logs: `~/Library/Logs/Karaoke Eternal Server`

#### Windows

- Database: `%USERPROFILE%\AppData\Roaming\Karaoke Eternal Server`
- Logs: `%USERPROFILE%\AppData\Roaming\Karaoke Eternal Server\logs`

#### Linux

- Database: `~/.config/Karaoke Eternal Server`
- Logs: `~/.config/Karaoke Eternal Server/logs`

<hr>

## Quick Start

1. Install and run [Karaoke Eternal Server](#karaoke-eternal-server) on the system that will serve the app and your media. Note that [players](#player) don't need to run on the same system as the server.

2. Browse to the **server URL**. In macOS or Windows you can open the URL using the Karaoke Eternal Server menu bar or tray icon.

<aside class="info">
  {{% icon-info %}}
  <p>Since the app is designed for mobile, use your phone for the best experience.</p>
</aside>

3. Create your **admin** account at the welcome page.

4. In the [account view](#account) you'll see Preferences. Expand the Media Folders section and add your [supported media](#media-files).

5. Once the media scanner finishes, head to the [library](#library) and add some songs by tapping an artist, then tapping a song title. A glowing song means it's upcoming in the queue.

6. Now we just need a [player](#player). On the system that will output audio/video, browse to the **server URL**, sign in with your admin account, and tap the **Start Player** link at the top. If you don't see a link, your current browser doesn't support fullscreen mode, but you can still navigate to `/player`.

7. In the player, press play and party!

<aside class="info">
  {{% icon-info %}}
  <p>Starting playback inside the player (rather than on a remote device) helps avoid browser auto-play restrictions. These can also be disabled.</p>
</aside>

Now that there's a player in the room, playback and display controls will appear on all your devices. Admins always see these, as well as the current singer during their turn.

<hr>

## Acknowledgements

- [David Zukowski](https://zuko.me){{% icon-external %}}: react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
- [Luke Tucker](https://github.com/ltucker/){{% icon-external %}}: the original JavaScript CD+Graphics implementation
- Mic favicon by [Freepik](https://www.freepik.com/){{% icon-external %}} from [flaticon.com](https://www.flaticon.com/){{% icon-external %}}
