---
title: F.A.Q.
description: Frequently asked questions for Karaoke Eternal (the app) and Karaoke Eternal Server
---

- [General](#general)
- [Networking](#networking)
- [Troubleshooting](#troubleshooting)

### General

#### What's the recommended audio/microphone setup?

Karaoke Eternal makes no assumptions about audio input so that it can work with any mic setup (including none at all). To mix the player's output (the music) with mics, there are generally 2 approaches:

  - Software mixing: The system running the player uses a USB or Thunderbolt audio interface that has mic(s) connected.
  - Hardware mixer: An external/outboard mixer has mic(s) connected, as well as the audio from the system running the player.

#### Where can I download karaoke songs?

Below is a non-exhaustive, probably U.S.-centric list of sources for licensed MP3+G or MP4 files (additions welcome):

- [KaraokeNerds](https://www.karaokenerds.com){{% icon-external %}}
- [SunFly Karaoke](https://www.sunflykaraoke.com){{% icon-external %}}
- [PartyTyme Karaoke](https://www.partytyme.net){{% icon-external %}}
- [Karaoke Version](https://www.karaoke-version.com){{% icon-external %}}
- [All Star Karaoke](https://www.allstardl.com){{% icon-external %}}
- [SBI Karaoke](https://downloads.sbikaraoke.com){{% icon-external %}}
- [PCDJ](https://www.pcdj.com/hd-mp4-karaoke-download-packs/){{% icon-external %}}

Karaoke tracks require original recording and production. Please support the creators!

#### Karaoke Eternal isn't quite what I'm looking for. What else is out there?

- [Karaoke Mugen](https://mugen.karaokes.moe/en/){{% icon-external %}}: Friends of K.E., Karaoke Mugen is geared toward anime and has a large library of downloadable songs.
- [PiKaraoke](https://github.com/vicwomg/pikaraoke){{% icon-external %}}: "A KTV-style karaoke song search and queueing system."
- [OpenKJ](https://openkj.org){{% icon-external %}}: "A collection of applications and services intended to make life easier for karaoke DJs."
- [Ultrastar Deluxe](https://usdx.eu){{% icon-external %}}: "A free open source karaoke game for your PC. The gameplay experience is similar to that of the commercial product SingStar™ by Sony Computer Entertainment."
- [Vocaluxe](https://www.vocaluxe.org){{% icon-external %}}: "A free and open source singing game, inspired by SingStar™ and the great Ultrastar Deluxe project."

(Are we missing something? Submit a PR!)

### Networking

#### Serving with NGINX (reverse proxy + custom path)

If you want to host the app at `/karaoke` for example, run Karaoke Eternal Server with the `--urlPath /karaoke` option, then use an NGINX config similar to the following, replacing `<your_server_ip>` and `<your_server_port>`:

```
  location /karaoke {
    proxy_pass http://192.168.1.11:8090/karaoke;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Proto $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}
```

### Troubleshooting

#### The media scanner stops before scanning all my files?

Check the <a href="{{< ref "docs/karaoke-eternal-server/#file-locations" >}}">scanner log</a> (or console output) and look for the last file the scanner encountered - typically it will be corrupt and should be removed.

#### My files have correct artist & title metadata tags; can they be used instead of filenames?

Yes, just place the following <a href='{{< ref "docs/karaoke-eternal-server/#configuring-the-metadata-parser" >}}'>_kes.v1.js</a> file in the applicable media folder:

{{< highlight js >}}
return ({ compose, getDefaultParser, defaultMiddleware }) => {
  return (ctx, next) => {
    ctx.artist = ctx.data.artist
    ctx.title = ctx.data.title
  }
}
{{< /highlight >}}

#### Running the player in Safari on macOS shows "The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission."

Safari is more stringent than other browsers, but you can [customize settings](https://support.apple.com/guide/safari/customize-settings-per-website-ibrw7f78f7fe/mac){{% icon-external %}} and set Auto-Play to "Allow all Auto-Play".
