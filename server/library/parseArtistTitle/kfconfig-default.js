// karaoke-forever string to artist/title parser defaults
module.exports = {
  // used to split into artist/song
  delimiter: '-', // regex or string
  // whether artist is on left side of delimiter (default=true)
  // @todo: invert for RTL languages
  artistFirst: true,
  // force Artist to this string
  artist: '',

  // replace options
  // --------------------
  // these can use regex or string for the search;
  // repl='' is assumed or specify an array, e.g. [search, repl]
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
