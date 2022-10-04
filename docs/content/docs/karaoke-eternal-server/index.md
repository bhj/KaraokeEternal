---
title: Karaoke Eternal Server
description: Documentation for Karaoke Eternal Server
resources:
- src: 'server-macos.png'
- src: 'server-windows.png'
---

The server hosts the web app and your media files, and can run on pretty much anything, including a Windows PC, Mac, or a dedicated server like a Raspberry Pi or Synology NAS.

Note that because the <a href="{{< ref "docs/karaoke-eternal-app#player" >}}">player</a> is fully browser-based, it doesn't need to run on the same system as the server, but it can.

# Installation

- <a href='{{< ref "docs/karaoke-eternal-server#windows-and-macos" >}}'>Windows and macOS</a>
- <a href='{{< ref "docs/karaoke-eternal-server#docker-synology-nas" >}}'>Docker (Synology NAS)</a>
- <a href='{{< ref "docs/karaoke-eternal-server#docker-cli-and-docker-compose" >}}'>Docker (CLI and docker-compose)</a>
- <a href='{{< ref "docs/karaoke-eternal-server#npm" >}}'>NPM</a>

### Windows and macOS

The <a href="{{% baseurl %}}download">Releases page</a>{{% icon-external %}} has the latest packages available for Windows and macOS. Once started, Karaoke Eternal Server will appear in the tray or menu bar:

<div class="row">
  {{% img "server-windows.png" "Karaoke Eternal Server (Windows)" "1x" %}}
  {{% img "server-macos.png" "Karaoke Eternal Server (macOS)" "1x" %}}
</div>

<aside class="info">
  {{% icon-info %}}
  <p>These packages are not currently signed. On macOS, <strong>do not</strong> disable Gatekeeper; simply right-click <code>Karaoke Eternal Server.app</code> in your Applications folder and choose Open. On Windows, click More Info and then Run Anyway.</p>
</aside>

<aside class="info">
  {{% icon-info %}}
  <p>The server chooses a random port at startup unless <a href="#cli--env">otherwise specified</a>.</p>
</aside>

See <a href="{{< ref "docs/getting-started" >}}">Getting Started</a> if you're new to Karaoke Eternal.

### Docker (Synology NAS)

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
    - Click Add Folder, and this time select your media folder(s). For their mount paths, enter something easy like `/mnt/karaoke`, etc. Once inside the app, you'll add these mount paths as <a href="{{< ref "docs/karaoke-eternal-app#preferences-admin-only" >}}">Media Folders</a>.
4. Click Done. Karaoke Eternal Server should now be running and reachable at `http://<your_synology_ip>:8080`.

See <a href="{{< ref "docs/getting-started" >}}">Getting Started</a> if you're new to Karaoke Eternal.

### Docker (CLI and docker-compose)

The [Karaoke Eternal docker image](https://hub.docker.com/r/radrootllc/karaoke-eternal) supports `amd64`, `arm64` and `arm/v7`. The image is modeled after [LinuxServer's](https://docs.linuxserver.io/general/running-our-containers):

  - `/config` should be mapped to a host volume (the database will be stored here)
  - media folder(s) should be mapped to host volume(s) (once inside the app, you'll add these as <a href="{{< ref "docs/karaoke-eternal-app#preferences-admin-only" >}}">Media Folders</a>)
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

See <a href="{{< ref "docs/getting-started" >}}">Getting Started</a> if you're new to Karaoke Eternal.

### NPM

Karaoke Eternal is available as an `npm` package for systems running [Node.js](https://nodejs.org){{% icon-external %}} 16 or later.

1. Install via ```npm```

{{< highlight shell >}}
  $ npm i -g karaoke-eternal
{{< /highlight >}}

2. Start the server

{{< highlight shell >}}
  $ karaoke-eternal-server
{{< /highlight >}}

3. Watch the output for "Web server running at..." and browse to the **server URL**.

See <a href="{{< ref "docs/getting-started" >}}">Getting Started</a> if you're new to Karaoke Eternal.

## Media Files

The following types are supported:

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG){{% icon-external %}} (.cdg and .mp3 files must be named the same; also supports an .m4a instead of .mp3)
- MP4 video (codec support can vary depending on the browser running the <a href="{{< ref "docs/karaoke-eternal-app#player" >}}">player</a>).

Your media files should be named in **"Artist - Title"** format by default (you can [configure this](#configuring-the-metadata-parser)). Media with filenames that couldn't be parsed won't appear in the library, so check the [scanner log](#file-locations) or console output for these.

### Configuring the Metadata Parser

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

### Creating a Metadata Parser (Experimental)

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

## CLI & ENV

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

## File Locations

The default locations for the database (`database.sqlite3`), web server log (`server.log`) and media scanner log (`scanner.log`) are as follows:

### macOS

 - Database: `~/Library/Application Support/Karaoke Eternal Server`
 - Logs: `~/Library/Logs/Karaoke Eternal Server`

### Windows

- Database: `%USERPROFILE%\AppData\Roaming\Karaoke Eternal Server`
- Logs: `%USERPROFILE%\AppData\Roaming\Karaoke Eternal Server\logs`

### Linux

- Database: `~/.config/Karaoke Eternal Server`
- Logs: `~/.config/Karaoke Eternal Server/logs`
