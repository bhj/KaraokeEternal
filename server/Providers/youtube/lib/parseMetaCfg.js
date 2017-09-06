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
      // remove text between (), [], or {}
      /[([{].*[)\]}]/ig,
    ],
    // applied to both Artist and Title after split
    postSplit: [
    ],
    // applied to Artist after split
    artist: [
    ],
    // applied to Title after split
    title: [
    ],
  }
}
