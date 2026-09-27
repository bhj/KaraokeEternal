---
title: My files have correct artist & title metadata tags; can they be used instead of filenames?
weight: 6
---

Yes, just place the following <a href='{{< ref "docs/karaoke-eternal-server/#advanced-templating" >}}'>_kes.v2.json</a> file in the applicable media folder:

{{< highlight js >}}
{
  artist: '${meta.artist}',
  title: '${meta.title}',
}
{{< /highlight >}}
