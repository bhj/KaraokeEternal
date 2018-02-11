module.exports = {
  // regex or string; artist/song get split around this match (default='-')
  delimiter: '-',
  // bool; whether artist is on left side of delimiter (default=true)
  artistFirst: true,
  // string; override Artist for songs in this file's scope (default='')
  artist: '',

  // these replacement regexes simply remove the matches by default;
  // use an array to define the replacement param, e.g. [find, repl]

  // applied to input string before splitting
  replPre: [
    // convert underscores to spaces
    [/_/g, ' '],
    // convert multiple spaces to single
    [/ {2,}/g, ' '],
  ],
  // applied to each part after splitting
  replPost: [
    // at least 2 letters followed by at least 2 digits
    /[a-zA-Z]{2,}\d{2,}/i,
    // track numbers
    /\d{1,2}\.?$/,
    // remove text having 'karaoke' between (), [], or {}
    /[([{](?=[^([{]*$).*karaoke.*[)\]}]/i,
  ],
  // applied to what is determined to be the artist name
  replArtist: [
    // Last, First [Middle] -> First [Middle] Last
    [/^(\w+), (\w+ ?\w+)$/ig, '$2 $1'],
    // correct for "..., The"
    [/(.*)(, The)$/i, 'The $1'],
  ],
  // applied to what is determined to be the song title
  replTitle: [
  ],
}
