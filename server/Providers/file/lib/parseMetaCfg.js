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
    // 2-4 letters followed by 1 or more digits
    /^[a-zA-Z]{2,4}\d{1,}$/i,
    // track numbers
    /^\d{1,2}\.?$/,
    // remove text having 'karaoke' between (), [], or {}
    /[([{](?=[^([{]*$).*karaoke.*[)\]}]/i,
    // correct for "..., The"
    [/(.*)(, The)$/i, 'The $1'],
    // correct for "..., A"
    [/(.*)(, A)$/i, 'A $1'],
  ],
  // applied to what is determined to be the artist name
  replArtist: [
    // Last, First [Middle] -> First [Middle] Last
    [/^(\w+), (\w+ ?\w+)$/ig, '$2 $1'],
    // featuring feat. feat ft => ft.
    [/ featuring /i, ' ft. '],
    [/ feat.? /i, ' ft. '],
    [/ ft /i, ' ft. '],
  ],
  // applied to what is determined to be the song title
  replTitle: [
  ],
}
