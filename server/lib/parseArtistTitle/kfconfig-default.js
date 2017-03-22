// karaoke-forever string to artist/title parser defaults
module.exports = {
  // regex or string; artist/song get split around this match (default='-')
  delimiter: '-',
  // bool; whether artist is on left side of delimiter (default=true)
  artistFirst: true,
  // string; override Artist for songs in this file's scope (default='')
  artist: '',

  // each stage is configured with regexes and/or strings and
  // simply removes matches by default (repl=''); use an array
  // to pass a replacement param/string, e.g. [find, repl]
  replacements: {
    // applied to input string before split to Artist/Title
    preSplit: [
      // remove non-digits follwed by digits
      /[\D]+[\d]+/i,
      // remove digits between non-word characters
      /\W*\d+\W*/i,
      // remove text between (), [], or {}
      /[\(\[\{].*[\)\]\}]/ig,
    ],
    // applied to both Artist and Title after split
    postSplit: [
      // correct for "..., The"
      [/(.*)(, The)$/i, 'The $1'],
    ],
    // applied to Artist after split
    artist: [
      // Last, First [Middle] -> First [Middle] Last
      [/^(\w+?), ?(\w* ?\w*.?)$/ig, '$2 $1'],
    ],
    // applied to Title after split
    title: [
    ],
  }
}
