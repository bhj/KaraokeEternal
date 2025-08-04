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
- <a href='{{< ref "docs/karaoke-eternal-server#docker-cli-and-compose-v2" >}}'>Docker (CLI and Compose v2)</a>
- <a href='{{< ref "docs/karaoke-eternal-server#docker-synology-nas" >}}'>Docker (Synology NAS)</a>
- <a href='{{< ref "docs/karaoke-eternal-server#npm" >}}'>NPM</a>

### Windows and macOS

The <a href="{{% baseurl %}}download">Releases page</a>{{% icon-external %}} has the latest packages available for Windows and macOS. Once started, Karaoke Eternal Server will appear in the tray or menu bar:

<div class="row">
  {{% img "server-windows.png" "Karaoke Eternal Server (Windows)" "1x" /%}}
  {{% img "server-macos.png" "Karaoke Eternal Server (macOS)" "1x" /%}}
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

### Docker (CLI and Compose V2)

The [Karaoke Eternal docker image](https://hub.docker.com/r/radrootllc/karaoke-eternal) supports `amd64`, `arm64` and `arm/v7`. It's modeled after [LinuxServer's](https://docs.linuxserver.io/general/running-our-containers) images:

  - `/config` should be mapped to a host volume (the database will be stored here)
  - media folder(s) should be mapped to host volume(s) (once inside the app, you'll add these as <a href="{{< ref "docs/karaoke-eternal-app#preferences-admin-only" >}}">Media Folders</a>)
  - port `8080` should be published to the desired host port
  - `PUID`, `PGID` and `TZ` environment variables are optional

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

Example `docker compose` usage:

{{< highlight yaml >}}
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

### Docker (Synology NAS)

This assumes your Synology DiskStation is running DSM 7.2 or later.

1. In Package Center, open Container Manager.
    - If Container Manager doesn't appear in the "Installed" section, install it from the "All Packages" section.
2. In the Registry section, search for and download the `radrootllc/karaoke-eternal` image.
3. In the Image section, select the `radrootllc/karaoke-eternal` image and click Run.
4. At the **General Settings** page of the container creation dialog:
    - Choose `Enable auto-restart` (if desired)
    - Click Next.
5. At the **Advanced Settings** page:

<div class="row">
  {{% img "server-synology.png" "Create Container > Advanced Settings " /%}}
</div>

  - **Port Settings**
    - Set the Local Port to `8080` or another if desired (this will be the port used when browsing to the app URL)
  - **Volume Settings**
    - Click Add Folder, select `docker` and create a new `karaoke-eternal` subfolder. Select that subfolder and click Select, then map it to `/config`. This path will be used to store the database.
    - Click Add Folder again, and this time select your media folder. Map it to `/mnt/karaoke` (once inside the app, you'll add this path in <a href="{{< ref "docs/karaoke-eternal-app#preferences-admin-only" >}}">Media Folders</a>.
  - Click Next.

6. Click Done.
    - Karaoke Eternal Server will run and you should be able to browse to the app URL at `http://<your_synology_ip>:8080` (or whichever Local Port you chose in step 5)

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

3. Look for "Web server running at..." and browse to the **server URL**.

See <a href="{{< ref "docs/getting-started" >}}">Getting Started</a> if you're new to Karaoke Eternal.

## Media Files

The following types are supported:

- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG){{% icon-external %}} (including zipped; also supports .m4a instead of .mp3)
- MP4 video (codec support can vary depending on the browser running the <a href="{{< ref "docs/karaoke-eternal-app#player" >}}">player</a>).

Your media files should be named in **"Artist - Title"** format by default (you can [configure this](#configuring-the-metadata-parser)). Media with filenames that couldn't be parsed won't appear in the library, so check the [scanner log](#file-locations) or console output for these.

## Metadata Parser

You can customize Karaoke Eternal's metadata parser by creating a file named `_kes.v2.json` in a media folder. It will apply to all media files in the folder, including subfolders. If any subfolders contain their own `_kes.v2.json` file, that will take precedence instead. These files can be in JSON or JSON5 format - JSON5 is used in the examples below since it's friendlier for humans.

### Basic Configuration

At the most basic, your `_kes.v2.json` file can alter some or all of the parser's default configuration, which is:

{{< highlight js >}}
{
  articles: ['A', 'An', 'The'], // used to normalize artist/title; set false to disable
  artistOnLeft: true, // assumes filenames are in "Artist - Title" format
  delimiter: '-', // assumes a hyphen separates the artist and title 
}
{{< /highlight >}}

For example, if you had a folder with filenames in the format "Title - Artist" instead, you could create this `_kes.v2.json` file in it:

{{< highlight js >}}
{
  artistOnLeft: false, // override default
}
{{< /highlight >}}

### Advanced Templating

If changing the parser's default configuration doesn't yield the desired results, you can also define your own "template" to override the result for one or more of these fields:

- `artist` (string) artist's name as it will be shown in the library
- `artistNorm` (string) normalized version of the artist's name; used for matching and sorting (`artist` if not set)
- `title` (string) song's title as it will be shown in the library
- `titleNorm` (string) normalized version of the song's title; used for matching and sorting (`title` if not set)

For each media file encountered, Karaoke Eternal makes a "context" available to your field template(s). This context includes the fields above (that is, the results from the built-in parser) in addition to:

- `name` (string) media filename (without extension)
- `meta` (object) media file's [metadata fields](https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md){{% icon-external %}}
- `dir` (string) full path of the containing folder
- `dirSep` (string) path separator used by the current OS (`/` or `\`)

Field templates are defined using [JSON-e syntax](https://json-e.js.org){{% icon-external %}}. In addition to JSON-e's [built-in methods](https://json-e.js.org/built-ins.html){{% icon-external %}}, a `replace` method is also provided for simple text replacement. Here are a few examples of how one might use field templates in their `_kes.v2.json` file:

{{< highlight js >}}
// explicitly set the artist field
{
  artist: "My Artist's Name",
}
{{< /highlight >}}

{{< highlight js >}}
// remove the text "junk" from anywhere in the parsed artist field
{
  artist: {
    $eval: 'replace(artist, "junk", "")'
  },
}
{{< /highlight >}}

{{< highlight js >}}
// remove the word "junk" case-insensitively from the start of the parsed artist field (regex syntax)
// the double-backslash resolves to a single backslash in the string
{
  artist: {
    $eval: 'replace(artist, "^junk\\s", "i", "")'
  },
}
{{< /highlight >}}

{{< highlight js >}}
// set artist and title using the media file's metadata tags
{
  artist: '${meta.artist}',
  title: '${meta.title}',
}
{{< /highlight >}}

<aside class="info">
  {{% icon-info %}}
  <p><strong>Tip: </strong>Setting the media scanner log or console level to "debug" (see below) can be helpful in troubleshooting your field templates.
</p>
</aside>

## CLI & ENV

Karaoke Eternal Server supports the following CLI options and environment variables. The numeric values used for log/console levels are: **0**=off, **1**=error, **2**=warn, **3**=info, **4**=verbose, **5**=debug

| Option | ENV | Description | Default |
| --- | --- | --- | --- |
| <span style="white-space: nowrap;">`--data <string>`</span>| <span style="white-space: nowrap;">`KES_PATH_DATA`</span> | Absolute path of folder for database files | |
| <span style="white-space: nowrap;">`-p, --port <number>`</span>| <span style="white-space: nowrap;">`KES_PORT`</span> | Web server port | auto |
| <span style="white-space: nowrap;">`--rotateKey`</span>| <span style="white-space: nowrap;">`KES_ROTATE_KEY`</span> | Rotate the session key at startup | |
| <span style="white-space: nowrap;">`--scan`</span>| <span style="white-space: nowrap;">`KES_SCAN`</span> | Run the media scanner at startup. Accepts a comma-separated list of pathIds, or "all" | |
| <span style="white-space: nowrap;">`--scannerConsoleLevel <number>`</span>| `KES_SCANNER_CONSOLE_LEVEL` | Media scanner console output level (default=4) | 4 |
| <span style="white-space: nowrap;">`--scannerLogLevel <number>`</span>| <span style="white-space: nowrap;">`KES_SCANNER_LOG_LEVEL`</span> | Media scanner log file level | 3 |
| <span style="white-space: nowrap;">`--serverConsoleLevel <number>`</span>| <span style="white-space: nowrap;">`KES_SERVER_CONSOLE_LEVEL`</span> | Web server console output level | 4 |
| <span style="white-space: nowrap;">`--serverLogLevel <number>`</span>| <span style="white-space: nowrap;">`KES_SERVER_LOG_LEVEL`</span> | Web server log file level | 3 |
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
