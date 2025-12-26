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

- [Library](#library)
- [Queue](#queue)
- [Account](#account)
- [Player](#player)

## Library

The library view lists available songs organized by artist, with search and filtering options at the top.

<div class="row">
  {{% img "app-library.png" "Library view" /%}}
  {{% img "app-library2.png" "Library search/filter view" /%}}
</div>

Tap to expand an artist, then tap a song's title to queue it. A glowing song and artist indicate they're upcoming in the queue.

Swiping left on a song reveals the following options:

<table class="button-descriptions">
  <tbody>
  <tr>
    <td>
      <svg viewBox="0 0 24 24">
        <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
      </svg>
    </td>
    <td>Get info</td>
    <td>Shows the song's underlying media file(s) and allows setting a preferred version. Admins only.</td>
  </tr>
  </tbody>
</table>

When a song has multiple versions (media files), admins see an italicized number after the title, and media in the folder highest in the [Media Folders](#preferences-admin-only) list will be used unless a preferred version is set (see Song Info above).

## Queue

The queue view shows your room's previous, current and upcoming songs.

<div class="row">
  {{% img "app-queue.png" "Queue view" /%}}
</div>

Karaoke Eternal automatically manages the queue using a round-robin method for fairness, without penalizing those joining later in the party. For example, a latecomer will be able to sing right after the next-up singer regardless of how long the queue was when they joined.

Swiping left on a queued song reveals some of the following options:

<table class="button-descriptions">
  <tbody>
  <tr>
    <td>
      <svg viewBox="0 0 24 24">
        <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
      </svg>
    </td>
    <td>Get info</td>
    <td>Shows the song's underlying media file(s) and allows setting a preferred version. Admins only.</td>
  </tr>
  <tr>
    <td>
      <svg viewBox="0 0 24 24">
        <path d="M5 4v2h14V4H5zm0 10h4v6h6v-6h4l-7-7-7 7z"/>
      </svg>
    </td>
    <td>Make next</td>
    <td>Moves the song to become the next one that user sings. Does *not* affect a user's place in the queue.</td>
  </tr>
  <tr>
    <td>
      <svg viewBox="0 0 24 24">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/>
      </svg>
    </td>
    <td>Queue again</td>
    <td>Adds a previously played song to the queue.</td>
  </tr>
  <tr>
    <td>
      <svg class="danger" viewBox="0 0 24 24">
        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8"/>
      </svg>
    </td>
    <td>Restart</td>
    <td>Restarts the queue from this song. Admins only.</td>
  </tr>
  <tr>
    <td>
      <svg class="danger" viewBox="0 0 24 24">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
      </svg>
    </td>
    <td>Skip</td>
    <td>Skips the current song and plays the next song. <strong>Pressing and holding</strong> will also remove all upcoming songs for this user.</td>
  </tr>
  <tr>
    <td>
      <svg class="danger" viewBox="0 0 24 24">
        <path d="M14.12 10.47 12 12.59l-2.13-2.12-1.41 1.41L10.59 14l-2.12 2.12 1.41 1.41L12 15.41l2.12 2.12 1.41-1.41L13.41 14l2.12-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM8 9h8v10H8z"/>
      </svg>
    </td>
    <td>Remove</td>
    <td>Removes an upcoming song. <strong>Pressing and holding</strong> will also remove all upcoming songs for this user.</td>
  </tr>
  </tbody>
</table>

Admins can manage anyone's queued songs, while standard users and guests can only manage their own.

## Account

The account view lets users manage their account, while admins will see additional panels.

<div class="row">
  {{% img "app-account.png" "Account view" /%}}
</div>

- [Rooms (admin only)](#rooms-admin-only)
- [Users (admin only)](#users-admin-only)
- [Preferences (admin only)](#preferences-admin-only)
- [My Account](#my-account)

### Rooms (admin only)

The Rooms panel allows admins to create, edit or remove rooms.

Karaoke Eternal uses "rooms" to organize sessions by time and space (spacetime?) Users choose an open room when signing in, and each room has its own queue. **Don't re-use rooms** - create a new room before each session so that you start with an empty queue, then set the room to `closed` when finished.

<div class="row">
  {{% img "app-account-room.png" "Room editor" /%}}
</div>

Rooms have a number of options, including:

- **Name**: The room name users will see when signing in (if more than one open room)
- **Password**: An optional password users will be required to enter when signing in
- **Status**: Rooms can have one of the following statuses:
  - `open` Can be signed in to and have songs queued
  - `closed` Can no longer be signed in to or have more songs queued. When closing, current occupants are unaffected and can continue playing through the existing queue
- **Users**: Only users with existing accounts can join a room by default. You can optionally allow users to join with new accounts and/or as guests
- **QR Code**: Displays a QR code in the room's player that will link users to the app, automatically choosing the room and optionally including the room's password if one is set

<aside class="warn">
  {{% icon-warn %}}
  <p>Removing a room will also remove its queue, so the history of songs played during that session will be lost.</p>
</aside>

### Users (admin only)

The Users panel allows admins to create, edit or remove users.

<div class="row">
  {{% img "app-account-user.png" "User editor" /%}}
</div>

### Preferences (admin only)

The Preferences panel allows admins to set these global preferences:

- **Media Folders**
  - Add folders with [supported media files]({{< ref "docs/karaoke-eternal-server#media-files" >}}) to scan them into the library. You can re-arrange the folder order by dragging and dropping, and when songs have multiple versions the one in the folder highest in the list will be used.
- **Player**
  - **ReplayGain (clip-safe)**: [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain){{% icon-external %}} metadata tags allow the player to automatically minimize volume differences between songs, resulting in a better experience for all, and without affecting the dynamic range of each song (no compression). This option should generally only be enabled when you know all of your media is properly tagged. It normally reduces the player's overall volume significantly, so just turn your output up, and/or your mics down.

### My Account

The My Account panel allows users to change their username, password, display name or picture as well as sign out.

## Player

The player is just another part of the app, and is designed to run fullscreen on the system handling audio/video for a [room](#rooms-admin-only). The latest versions of these browsers are officially supported:

  - Chromium/Chrome/Edge
  - Firefox
  - Safari

<div class="row">
  {{% img "app-player.jpg" "Player view" /%}}
  {{% img "app-displayctrl.png" "Display options" /%}}
</div>

To start a player, sign in to the desired room as an admin and a player link will appear at the top. If you don't see a link that means fullscreen support wasn't detected, but you can still manually navigate to `/player`.

Once a player is in the room, playback and display controls will appear. Admins will always see these, as well as the user who is currently singing.

<aside class="info">
  {{% icon-info %}}
  <p>Starting playback inside the player (rather than on a remote device) helps avoid browser auto-play restrictions. See the <a href="{{< ref "faq#enabling-autoplay" >}}">F.A.Q.</a> for more on how to enable auto-play in your browser.</p>
</aside>
