---
title: F.A.Q.
sitemap:
  changefreq: monthly
  priority: 0.5
---

## Where can I download karaoke songs?

Below is a non-exhaustive, probably U.S.-centric list of sources for licensed MP3+G or MP4 files (additions welcome):

- [SunFly Karaoke](https://www.sunflykaraoke.com)
- [PartyTyme Karaoke](https://www.partytyme.net)
- [Karaoke Version](https://www.karaoke-version.com)
- [All Star Karaoke](https://www.allstardl.com)
- [SBI Karaoke](https://downloads.sbikaraoke.com)
- [PCDJ](https://www.pcdj.com/hd-mp4-karaoke-download-packs/)

Karaoke tracks require original recording and production. Please support the creators!

## Is a microphone required?

No, but... is it still karaoke without a mic? :)

Karaoke Forever makes no assumptions about audio input so that it can work with any microphone setup, including none at all. The <a href='{{< ref "docs/index.md#player" >}}'>player's</a> output (music) can be mixed with microphones in software or an outboard mixer (see below).

## What's the recommended audio setup?

There are generally 2 ways to mix Karaoke Forever's player output (the music) with microphones. In either case, at least 2 mics are recommended.

  - Software mixing: The system running the player uses a USB or Thunderbolt audio interface that has mic(s) connected.
  - Hardware mixer: An external/outboard mixer has mic(s) connected, as well as the audio from the system running the player.

## My mp3/mp4 files have correct artist & title tags; can they be used instead of filenames?

Yes, you can tell the metadata parser to use the embedded tags as-is if you'd prefer (or if your filenames aren't in "Artist - Title" format). Place the following `_kfconfig.js` in the applicable media folder:

{{< highlight js >}}
return ({ compose, getDefaultParser, defaultMiddleware }) => {
  return (ctx, next) => {
    ctx.artist = ctx.tags.artist
    ctx.title = ctx.tags.title
  }
}
{{< /highlight >}}
