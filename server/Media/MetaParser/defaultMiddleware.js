module.exports = function (cfg) {
  const pre = [
    repl(/_/g, ' '), // underscores to spaces
    repl(/ {2,}/g, ' '), // multiple spaces to single
  ]

  const parse = [
    detectSeparator(cfg),
    splitToParts,
    scrubParts([
      /^\d*\.?$/, // looks like a track number?
      /^\W*$/, // all non-word chars?
      /^[a-zA-Z]{2,4}\d{1,}/i, // starts with 2-4 letters followed by 1 or more digits
    ]),
    setArtistTitle,
  ]

  const post = [
    repl(/[([{](?=[^([{]*$).*karaoke.*[)\]}]/i), // remove text having 'karaoke' between (), [], or {}
    repl(/^['|"](.*)['|"]$/, '$1'), // remove any surrounding quotes
    repl(/(.*)(, The)$/i, 'The $1'), // correct for "..., The"
    repl(/(.*)(, A)$/i, 'A $1'), // correct for "..., A"
    replArtist(/^(\w+), (\w+ ?\w+)$/ig, '$2 $1'), // Last, First [Middle] -> First [Middle] Last
    titleCase,
    replArtist(/ featuring /i, ' ft. '), // featuring => ft.
    replArtist(/ feat\.? /i, ' ft. '), // feat => ft.
    replArtist(/ ft\.? /i, ' ft. '), // ft => ft.
  ]

  return {
    pre,
    parse,
    post,
  }
}

function splitToParts (ctx, next) {
  // split, trim and remove empty parts
  ctx.parts = ctx.str.split(ctx.cfg.separator)
    .map(part => part.trim())
    .filter(part => part.length)

  next()
}

function setArtistTitle (ctx, next) {
  // stop if already set
  if (ctx.artist || ctx.title) return next()

  // @todo this assumes delimiter won't appear in title
  ctx.title = ctx.cfg.artistOnLeft ? ctx.parts.pop() : ctx.parts.shift()
  ctx.artist = ctx.parts.join(ctx.cfg.separator)

  next()
}

function scrubParts (patterns) {
  return function (ctx, next) {
    ctx.parts = ctx.parts.filter(part => {
      if (ctx.parts.length < 3) return true
      return !patterns.some(exp => !part.replace(exp, '').trim())
    })

    next()
  }
}

function detectSeparator (cfg = {}) {
  return function (ctx, next) {
    const matches = ctx.str.match(/ in the style of /i)

    ctx.cfg = {
      separator: matches ? matches[0] : '-',
      artistOnLeft: !matches,
      ...cfg,
    }

    next()
  }
}

function titleCase (ctx, next) {
  if (ctx.artist) ctx.artist = ctx.artist.replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.substr(1)
  })

  if (ctx.title) ctx.title = ctx.title.replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.substr(1)
  })

  next()
}

// global replace
function repl (pattern, replacement = '') {
  return function (ctx, next) {
    ctx.str = ctx.str.replace(pattern, replacement).trim()
    if (ctx.artist) ctx.artist = ctx.artist.replace(pattern, replacement).trim()
    if (ctx.title) ctx.title = ctx.title.replace(pattern, replacement).trim()
    next()
  }
}

function replArtist (pattern, replacement = '') {
  return function (ctx, next) {
    if (ctx.artist) ctx.artist = ctx.artist.replace(pattern, replacement).trim()
    next()
  }
}

function replTitle (pattern, replacement = '') {
  return function (ctx, next) {
    if (ctx.title) ctx.title = ctx.title.replace(pattern, replacement).trim()
    next()
  }
}
