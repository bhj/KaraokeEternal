---
title: My files have correct artist & title metadata tags; can they be used instead of filenames?
category: Troubleshooting
weight: 6
---

Yes, just place the following <a href='{{< ref "docs/karaoke-eternal-server/#configuring-the-metadata-parser" >}}'>_kes.v1.js</a> file in the applicable media folder:

{{< highlight js >}}
return ({ compose, getDefaultParser, defaultMiddleware }) => {
  return (ctx, next) => {
    ctx.artist = ctx.data.artist
    ctx.title = ctx.data.title
  }
}
{{< /highlight >}}
