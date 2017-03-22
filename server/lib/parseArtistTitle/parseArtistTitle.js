const parserDefaults = require('./kfconfig-default.js')

function parseArtistTitle(str, cfg) {
  cfg = cfg || parserDefaults
  let artist, title

  // global pre-processing
  str = replaceMulti(str, cfg.replacements.preSplit)

  // split at delimiter
  let parts = str.split(cfg.delimiter)

  // @todo this assumes delimiter won't appear in title
  title = cfg.artistFirst ? parts.pop() : parts.shift()

  if (cfg.artist) {
    artist = cfg.artist
  } else if (parts.length) {
    artist = parts.join(cfg.delimiter)
  } else {
    // out of parts!
    return 'no parts left to parse'
  }

  // artist processing & global post-processing
  artist = replaceMulti(artist, cfg.replacements.postSplit)
  artist = replaceMulti(artist, cfg.replacements.artist)
  artist = titleCase(artist)

  // title processing & global post-processing
  title = replaceMulti(title, cfg.replacements.postSplit)
  title = replaceMulti(title, cfg.replacements.title)
  title = titleCase(title)

  return { artist, title }
}

module.exports = parseArtistTitle


function titleCase(str) {
  return str.replace(/\w\S*/g, function(tStr) {
    return tStr.charAt(0).toUpperCase() + tStr.substr(1).toLowerCase()
  })
}

function replaceMulti(str, repl) {
  repl.forEach(r => {
    const find = Array.isArray(r) ? r[0] : r
    const repl = Array.isArray(r) ? r[1] : ''
    str = str.trim().replace(find, repl)
  })

  return str.trim()
}
