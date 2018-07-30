module.exports = {
  wrapperMiddleware,
  preMiddleware: [
    repl(/_/g, ' '), // underscores to spaces
    repl(/ {2,}/g, ' '), // multiple spaces to single
    repl(/^[a-zA-Z]{2,4}\d{1,}/i), // starts with 2-4 letters followed by 1 or more digits
  ],
  parseMiddleware: [
    detectInTheStyleOf,
    parseSeparator,
  ],
  postMiddleware: [
    repl(/[([{](?=[^([{]*$).*karaoke.*[)\]}]/i), // remove text having 'karaoke' between (), [], or {}
    repl(/^['|"](.*)['|"]$/, '$1'), // remove any surrounding quotes
    repl(/(.*)(, The)$/i, 'The $1'), // correct for "..., The"
    repl(/(.*)(, A)$/i, 'A $1'), // correct for "..., A"
    replArtist(/^(\w+), (\w+ ?\w+)$/ig, '$2 $1'), // Last, First [Middle] -> First [Middle] Last
    titleCase,
    replArtist(/ featuring /i, ' ft. '), // featuring => ft.
    replArtist(/ feat.? /i, ' ft. '), // feat., feat => ft.
    replArtist(/ ft /i, ' ft. '), // ft => ft.
    replArtist(/ ft\. /i, ' ft. '), // Ft. => ft.
  ],
}

function wrapperMiddleware (ctx, next) {
  // some middleware might want this?
  ctx.origStr = ctx.str

  // run middleware chain
  next()

  // if we don't have artist and title by now, parse failed
  if (!ctx.artist || !ctx.title) {
    throw new Error('Could not determine artist or title')
  }

  return { artist: ctx.artist, title: ctx.title }
}

function parseSeparator (ctx, next) {
  // bail if another middleware already parsed these
  if (ctx.artist || ctx.title) return next()

  const cfg = {
    separator: '-',
    artistOnLeft: true,
    ...ctx.cfg,
  }

  // split, trim and remove empty parts
  let parts = ctx.str.split(cfg.separator)
    .map(part => part.trim())
    .filter(part => part.length)

  if (parts.length < 2) return next()

  // try to remove parts (if there are parts to spare)
  for (let i = 0, max = parts.length; i < max && parts.length > 2;) {
    let part = parts[i]

    part = part.replace(/^\d*\.?$/, '') // looks like a track number?
    part = part.replace(/^\W*$/, '') // all non-word chars?

    // stop cleaning if we encounter word chars
    if (part.trim()) {
      break
    }

    // remove empty part (shifts indeces down 1)
    parts.splice(i, 1)
    max--
  } // end for

  // @todo this assumes delimiter won't appear in title
  ctx.title = cfg.artistOnLeft ? parts.pop() : parts.shift()
  ctx.artist = parts.join(cfg.separator)

  return next()
}

function detectInTheStyleOf (ctx, next) {
  // don't override custom config
  if (ctx.cfg.separator || typeof ctx.cfg.artistOnLeft !== 'undefined') return next()

  const matches = ctx.str.match(/ in the style of /i)

  if (matches) {
    ctx.cfg.separator = matches[0]
    ctx.cfg.artistOnLeft = false
  }

  return next()
}

function titleCase (ctx, next) {
  if (ctx.artist) ctx.artist = ctx.artist.replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.substr(1)
  })

  if (ctx.title) ctx.title = ctx.title.replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.substr(1)
  })

  return next()
}

// global replace
function repl (pattern, replacement = '') {
  return function (ctx, next) {
    ctx.str = ctx.str.replace(pattern, replacement).trim()
    if (ctx.artist) ctx.artist = ctx.artist.replace(pattern, replacement).trim()
    if (ctx.title) ctx.title = ctx.title.replace(pattern, replacement).trim()
    return next()
  }
}

function replArtist (pattern, replacement = '') {
  return function (ctx, next) {
    if (ctx.artist) ctx.artist = ctx.artist.replace(pattern, replacement).trim()
    return next()
  }
}

function replTitle (pattern, replacement = '') {
  return function (ctx, next) {
    if (ctx.title) ctx.title = ctx.title.replace(pattern, replacement).trim()
    return next()
  }
}
