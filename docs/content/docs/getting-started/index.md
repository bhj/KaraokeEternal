---
title: Getting Started
description: Getting started with Karaoke Hydra and Karaoke Hydra Server
---

You'll want to have a few things to get started with Karaoke Hydra:

- **Songs**: Karaoke Hydra supports MP4 video files as well as MP3 audio files that have lyrics in an accompanying CDG file (commonly known as [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG){{% icon-external %}}). See the <a href='{{< ref "faq#where-can-i-download-karaoke-songs" >}}'>F.A.Q.</a> if you're looking for songs!

- **Server**: This can be a Windows PC, Mac, or a dedicated server like a Raspberry Pi or NAS. Karaoke Hydra Server runs on pretty much anything to serve the web app and your media files.

- **Player**: This will be the system that is connected to your display and speakers, running Karaoke Hydra's player in a browser. It could be the same system as the server, but because the player is fully browser-based it doesn't need to be.

Microphones are *not* required since the player itself only outputs music - this allows your audio setup to be as simple or complex as you like. See the <a href='{{< ref "faq#recommended-audio-microphone-setup" >}}'>F.A.Q.</a> for more information.

## 1. Install Karaoke Hydra Server

On the system that will serve the web app and your media files, <a href='{{< ref "docs/karaoke-eternal-server#installation" >}}'>install and run Karaoke Hydra Server</a>, then head back here and continue.

## 2. Browse to the Server URL

Once the server is running, browse to the web app at the **server URL**.

<aside class="info">
  {{% icon-info %}}
  <p>Since the app is designed for mobile, it's recommended to use your phone for the best experience once you're finished with the initial setup here.</p>
</aside>

## 3. Create Admin Account

Since this is your first time with Karaoke Hydra, you'll be asked to create your **admin** account.

Make sure you use a strong password and store it someplace safe, since admins can manage users, rooms, preferences and more.

<aside class="info">
  {{% icon-info %}}
  <p>Karaoke Hydra Server stores all data on <strong>your server only</strong>.</p>
</aside>

## 4. Add Media Folders

Once signed in, you'll see an (unsurprisingly) empty library. Head to the Account view by following the "Add media folders" link or tapping the face icon in the bottom navigation area:

<div class="row">
  {{% img "app-account.png" "Account view" /%}}
</div>

Since you're an admin, the Account view will have a number of sections. In the **Preferences** section, select **Media Folders** and add the folder(s) containing your songs.

## 5. Queue a Song

Once the media scanner is finished, you should see your artists/songs back over in the Library view. If they aren't appearing, make sure your media files are named using the **"Artist - Title"** convention and are a <a href='{{< ref "docs/karaoke-eternal-server#media-files" >}}'>supported format</a>.

<div class="row">
  {{% img "app-library.png" "Library view" /%}}
</div>

In the Library view, queue a song by tapping an artist, then tapping a song. Go ahead and queue a few - the songs will glow to indicate they're queued. Pretty simple, right?

You can do a lot more in the Library view, but for now let's play some music!

## 6. Start the Player

Karaoke Hydra's player is just another part of the browser app, but it's meant to run fullscreen on the system connected to your display and speakers. If you aren't using the system you intend to use as the player, go to it now, browse to the **server URL**, and sign in with your admin account.

By now you've probably noticed a **"No player in room"** message at the top of the app. Click the **Start Player** link to do just that!

<aside class="info">
  {{% icon-info %}}
  <p>If you don't see the <strong>"No player in room"</strong> message, your browser doesn't support fullscreen mode and may not be suitable as a player. You can still manually navigate to <code>/player</code>, though.</p>
</aside>

<div class="row">
  {{% img "app-player.jpg" "Player view" /%}}
</div>

Now that there's a player in the room, playback and display controls will appear. Admins will always see these, as well as the user who is currently singing.

Go ahead and press play in the player to start the party!

<aside class="info">
  {{% icon-info %}}
  <p>Starting playback inside the player (rather than on a remote device) helps avoid browser auto-play restrictions. See the <a href="{{< ref "faq#enabling-autoplay" >}}">F.A.Q.</a> for more on how to enable auto-play in your browser.</p>
</aside>


## 7. Next Steps

To get the most out of Karaoke Hydra, continue with the <a href="{{< ref "docs/karaoke-eternal-app" >}}">app documentation</a>. Seriously, there's quite a bit going on beneath the surface!

You can also join the <a href="{{% baseurl %}}discord" rel="noopener">Karaoke Hydra Discord Server</a>{{% icon-external %}} for general support and development chat, or just to say hi!

Lastly, if you are able, please consider [sponsoring](https://www.karaoke-eternal.com/sponsor). This project relies on its community to sustain it, and your support has a direct impact.

Now, go get singing!
