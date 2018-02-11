module.exports = function (str, cfg) {
  let artist, title
  const parts = []

  // global replacements
  str = replaceMulti(str, cfg.replPre)

  // split at delimiter and run replacements on each part
  str.split(cfg.delimiter).forEach(part => {
    part = replaceMulti(part, cfg.replPost)
    if (part) parts.push(part)
  })

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

  // artist processing
  artist = replaceMulti(artist, cfg.replArtist)
  artist = titleCase(artist)

  // title processing & global post-processing
  title = replaceMulti(title, cfg.replTitle)
  title = titleCase(title)

  return { artist, title }
}

function titleCase (str) {
  return str.replace(/\w\S*/g, function (tStr) {
    return tStr.charAt(0).toUpperCase() + tStr.substr(1).toLowerCase()
  })
}

function replaceMulti (str, repl) {
  repl.forEach(r => {
    const find = Array.isArray(r) ? r[0] : r
    const repl = Array.isArray(r) ? r[1] : ''
    str = str.trim().replace(find, repl)
  })

  return str.trim()
}
