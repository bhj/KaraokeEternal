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

## Overview

Host awesome karaoke parties where everyone can find and queue songs from their phone's web browser. Supports songs in [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) (mp3+cdg) and mp4 video files. No internet connection required.

Karaoke Forever has a few parts:

- **[Server:](#karaoke-forever-server)** Runs on the macOS/Windows/Linux/etc. system with your [supported media files](#supported-media-files). Serves the web app on your local network.

- **[Web app:](#karaoke-forever-the-web-app)** Designed from the ground up for mobile browsers, anyone can easily join using their phone.

- **[Player:](#player-admin-only)** Just another name for the the web app when it's running fullscreen on the system handling audio/video for the room.

**Note:** Karaoke Forever does not handle audio *input* since there are a wide variety of possible audio interface and microphone configurations. It is assumed that the player's output will be mixed with the microphone input(s) by the system.

## Quick Start

1. Install and run Karaoke Forever Server on the system that will locally serve the media files and web app. **Important:** The server app is not currently signed, so macOS and Windows SmartScreen will complain by default. *Do not disable Gatekeeper* on macOS - simply right-click the file and choose Open.

2. Click the Karaoke Forever Server menubar icon (macOS) or right-click the tray icon (Windows) to show the server URL. You can click *Open in browser* or browse to the server URL (including port) from any device on the network. The web app is primarily designed for mobile browsers.

3. Enter your user details and click Create Account to create your admin account.

4. In the Preferences panel, tap Media Folders and add folder(s) containing supported media. Songs will appear in the library when the scan is complete.

5. If you are not on the system that will be the player (handling audio/video) go there now, browse to the server URL and sign in with your admin account.

6. You should see a notice that no players are present in the room, so tap the Start Player link. (If you don't see a notice it means the browser does not support fullscreen mode; you can still navigate to `/player` manually for this walkthrough)

7. Now that a player is running, use another device (or browser tab) to queue some songs and press play to begin. The player will play as long as there are songs in the queue, and after running out of songs the next one to be queued will start immediately.

You are now ready to test your audio setup and start the party!

## Karaoke Forever (the web app)

### Library

The library page lists available songs organized by artist, and allows searching both artists and titles. Tapping a song's title will add it to the queue, and tapping its star will favorite it.

If you're an admin, you may see songs with an italicized number at the end, like *(2)*. That would mean there are two versions (media files) of the song. The version in the folder with the highest priority will be queued when tapped (see [Media Folder Preferences](#media-folders)).

Admins can reveal additional options for each song by swiping left. Currently the only additional option is Get Info, which shows the song's underlying media file(s).

### Queue

The queue page shows the current, upcoming and previously played songs. Users can remove any of their upcoming songs and will see a notice (on all pages) when they're up next.

While a user is up they temporarily have access to the playback controls, including pause, play, next and volume. Admins always have access to these controls.

### Account

The account page lets users update their account, and will have a few additional panels for admins.

#### Rooms (Admin Only)

The Rooms panel allows admins to create, edit and remove rooms.

Karaoke Forever uses "rooms" to organize sessions by space and time (spacetime?) Rooms can be either open or closed, and every room has its own song queue.

Users choose an open room when signing in, and can only be signed in to one room at a time. Closing a room does not sign out users currently in it; only new sign-ins will be prevented.

*WARNING:* Removing a room will also remove its queue, so the history of songs played during that session will be lost.

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

Once running, click the Karaoke Forever Server menubar icon (macOS) or right-click the tray icon (Windows) to show the server URL. You can click *Open in browser* or browse to the server URL (including port) from any device on the network. Note that the web app is primarily designed for mobile browsers.

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

Karaoke Forever expects media filenames to be in the format "Artist - Title" by default. To customize the parser's behavior, see [The Meta Parser](#the-meta-parser).

**Note:** Since mp4/m4a files are only containers, codec support can vary depending on the browser running the [player](#player).

### The Meta Parser

Karaoke Forever expects media filenames to be in the format "Artist - Title" by default. You can change the parser behavior on a per-folder basis using a `_kfconfig.js` file. When a `_kfconfig.js` file is encountered in a folder it applies to all files and subfolders within. If any subfolders also have their own `_kfconfig.js` files, those take precedence.

#### Configuring the Parser

The default parser normally looks for a hyphen (-) in the filename and assumes the artist's name is on the left, and song title on the right. If a folder has media filenames having the positions reversed, for example, add a `_kfconfig.js` file that returns a configuration object:

```
return {
  artistOnLeft: false, // default: true
  separator: '-',      // default: '-'
}
```

*Note:* It's important to `return` the configuration object. JSON format is not currently supported.

#### Augmenting or Replacing the Parser (Advanced)

Instead of a configuration object (as shown above), you can return a function that will be used to create a new parser, allowing you to augment or even replace the default parser. This is useful if you have many oddly-named files that could use some batch string processing to appear nicely in the library.

Karaoke Forever uses a simple middleware-based parser. Here *middleware* refers to an individual function, and *parser* refers to a stack of middleware that will run in series when called (it is also a function). Your `_kfconfig.js` should return a *parser creator*, in other words, a function that Karaoke Forever will call to get the parser for the current folder.

Your parser creator has access to the default middleware and parser so it's easy to add a bit of string manipulation without reinventing the wheel. For example, this will create a parser that removes the word 'junk' from the input filename:

```
return ({ composeSync, getDefaultParser, getDefaultMiddleware}) => {
  function customMiddleware (ctx, next) {
    ctx.file = ctx.file.replace('junk', '')
    next()
  }

  return composeSync([
    customMiddleware,
    getDefaultParser(),
  ])
}

```
When Karaoke Forever scans a media file, it calls the parser with an object having the filename (without extension) as the property `file` (string). At the end of the middleware chain, this object is expected to have the properties `artist` and `title` (strings). What happens in between is up to the parser. It's important that each middleware calls `next` unless you don't want the chain to continue (for instance, if you've set `artist` and `title` absolutely and want to use them as-is).

Your parser creator should accept an object with the following functions:

- `composeSync`: Takes an array of middleware and returns them as a composed function that can be used as a parser. It currently requires a flat array, but there's nothing preventing array items from being composed functions themselves. As the name implies, the middleware stack is currently run synchronously.

- `getDefaultParser`: Returns the default parser. Optionally accepts a configuration object (see [Configuring the Parser](#configuring-the-parser)). In the example above our parser is doing a bit of pre-cleaning using `customMiddleware`, then running the default parser to handle the rest. The default parser can itself be used as middleware, with custom middleware run before and/or after.

- `getDefaultMiddleware`: Returns an object whose properties (`pre`, `parse`, `post`) correspond to the default parsing stages. Each property is an array of middleware, allowing more granular control over how to (re)compose the default parser. Optionally accepts a configuration object (see [Configuring the Parser](#configuring-the-parser)).

The following code is functionally identical to the previous example, but uses each stage from `getDefaultMiddleware` explicitly. This allows inserting custom middleware between stages, or removing a stage altogether if you do not include it.

```
return ({ composeSync, getDefaultParser, getDefaultMiddleware}) => {
  const defaultMiddleware = getDefaultMiddleware()

  function customMiddleware (ctx, next) {
    ctx.file = ctx.file.replace('junk', '')
    next()
  }

  return composeSync([
    customMiddleware,
    ...defaultMiddleware.pre,
    ...defaultMiddleware.parse,
    ...defaultMiddleware.post,
  ])
}

```
