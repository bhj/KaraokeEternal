---
title: Karaoke Eternal (the app)
description: Documentation for Karaoke Eternal (the app)
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

Karaoke Eternal is a modern mobile browser app that lets everyone join without having to install anything on their phones. It's built for touch, but a mouse is supported in desktop browsers (click and drag to emulate swipe gestures).

## Library

The library view lists available songs organized by artist, with search and filtering options at the top.

<div class="row">
  {{% img "app-library.png" "Library view" %}}
  {{% img "app-library2.png" "Library search/filter view" %}}
</div>

Tap to expand an artist, then tap a song's title to queue it. A glowing song and artist indicate they're upcoming in the queue.

Swiping left on a song reveals the following options:

  - **Song Info** (admin only): Shows underlying media and allows setting a preferred version.

When a song has multiple versions (media files), admins see an italicized number after the title, and media in the folder highest in the [Media Folders](#preferences-admin-only) list will be used unless a preferred version is set (see Song Info above).

## Queue

The queue view shows your room's previous, current and upcoming songs.

<div class="row">
  {{% img "app-queue.png" "Queue view" %}}
</div>

Karaoke Eternal automatically manages the queue using a round-robin method for fairness, without penalizing those joining later in the party. For example, a latecomer will be able to sing right after the next-up singer regardless of how long the queue was when they joined.

Swiping left on a queued song reveals the following options:

- **Make User's Next**: Moves the song to become the next one that user sings. Does *not* affect that user's place in the queue.
- **Song Info** (admin only): Shows underlying media and allows setting a preferred version.
- **Remove**: Removes the song from the queue.

Normal users can only manage their own queued songs, but admins can manage anyone's.

## Account

The account view lets users manage their account, while admins will see additional panels.

<div class="row">
  {{% img "app-account.png" "Account view" %}}
</div>

### Rooms (admin only)

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

### Preferences (admin only)

The Preferences panel allows admins to set these global preferences:

- **Media Folders**
  - Add folders with <a href="{{< ref "docs/karaoke-eternal-server#media-files" >}}">supported media files</a> to scan them into the library. You can re-arrange the folder order by dragging and dropping, and when songs have multiple versions the one in the folder highest in the list will be used.
- **Player**
  - **ReplayGain (clip-safe)**: [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain){{% icon-external %}} metadata tags allow the player to automatically minimize volume differences between songs, resulting in a better experience for all, and without affecting the dynamic range of each song (no compression). This option should generally only be enabled when you know all of your media is properly tagged. It normally reduces the player's overall volume significantly, so just turn your output up, and/or your mics down.

### My Account

The My Account panel allows users to change their username, password, display name or picture as well as sign out.

## Player

The player is just another part of the app, and is designed to run fullscreen on the system handling audio/video for a [room](#rooms-admin-only). The latest versions of these browsers are officially supported:

  - Firefox
  - Chromium/Chrome/Edge

<div class="row">
  {{% img "app-player.jpg" "Player view" %}}
  {{% img "app-displayctrl.png" "Display options" %}}
</div>

To start a player, sign in to the desired room as an admin and a player link will appear at the top. If you don't see a link that means fullscreen support wasn't detected, but you can still manually navigate to `/player`.

Once a player is in the room, playback and display controls will appear. Admins will always see these, as well as the user who is currently singing.

<aside class="info">
  {{% icon-info %}}
  <p>Starting playback inside the player (rather than on a remote device) helps avoid browser auto-play restrictions. These can also be disabled.</p>
</aside>
