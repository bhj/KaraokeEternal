const m = module.exports = new Map()

// ----------------------
// begin middleware stack
// ----------------------

m.set('normalize whitespace', (ctx, next) => {
  ctx.name = ctx.name.replace(/_/g, ' ') // underscores to spaces
  ctx.name = ctx.name.replace(/ {2,}/g, ' ') // multiple spaces to single
  next()
})

m.set('de-karaoke', (ctx, next) => {
  // 'karaoke' or 'vocal' surrounded by (), [], or {}
  ctx.name = ctx.name.replace(/[([{](?=[^([{]*$).*(?:karaoke|vocal).*[)\]}]/i, '')
  next()
})

// --------------
// parse
// --------------

// detect delimiter and split to parts
m.set('split', (ctx, next) => {
  const inTheStyleOf = ctx.name.match(/ in the style of /i)

  ctx.cfg = {
    delimiter: inTheStyleOf ? inTheStyleOf[0] : '-',
    artistOnLeft: !inTheStyleOf,
    ...ctx.cfg,
  }

  // allow leading and/or trailing space when searching for delimiter,
  // then pick the match with the most whitespace (longest match) as it's
  // most likely to be the actual delimiter rather than a false positive
  const d = ctx.cfg.delimiter instanceof RegExp ? ctx.cfg.delimiter : new RegExp(` ?${ctx.cfg.delimiter} ?`, 'g')
  const matches = ctx.name.match(d)

  if (!matches) {
    throw new Error('no artist/title delimiter in filename')
  }

  const longest = matches.reduce((a, b) => a.length > b.length ? a : b)
  ctx.parts = ctx.name.split(longest)

  if (ctx.parts.length < 2) {
    throw new Error('no artist/title delimiter in filename')
  }

  next()
})

m.set('clean parts', cleanParts([
  /^\d*\.?$/, // looks like a track number
  /^\W*$/, // all non-word chars
  /^[a-zA-Z]{2,4}[ -]?\d{1,}/i, // 2-4 letters followed by 1 or more digits
]))

// set title
m.set('set title', (ctx, next) => {
  // skip if already set
  if (ctx.title) return next()

  // @todo this assumes delimiter won't appear in title
  ctx.title = ctx.cfg.artistOnLeft ? ctx.parts.pop() : ctx.parts.shift()
  ctx.title = ctx.title.trim()
  next()
})

// set arist
m.set('set artist', (ctx, next) => {
  // skip if already set
  if (ctx.artist) return next()

  ctx.artist = ctx.parts.join(ctx.cfg.delimiter)
  ctx.artist = ctx.artist.trim()
  next()
})

// -----------
// post
// -----------

// remove any surrounding quotes
m.set('remove quotes', (ctx, next) => {
  ctx.artist = ctx.artist.replace(/^['|"](.*)['|"]$/, '$1')
  ctx.title = ctx.title.replace(/^['|"](.*)['|"]$/, '$1')
  next()
})

// some artist-specific tweaks
m.set('artist tweaks', (ctx, next) => {
  // Last, First [Middle] -> First [Middle] Last
  ctx.artist = ctx.artist.replace(/^(\w+), (\w+ ?\w+)$/ig, '$2 $1')

  // featuring/feat/ft -> ft.
  ctx.artist = ctx.artist.replace(/ featuring /i, ' ft. ')
  ctx.artist = ctx.artist.replace(/ f(ea)?t\.? /i, ' ft. ')
  next()
})

// move leading articles to end
m.set('move leading articles', (ctx, next) => {
  ctx.artist = moveArticles(ctx.artist, ctx.cfg.articles)
  ctx.title = moveArticles(ctx.title, ctx.cfg.articles)
  next()
})

// ---------
// normalize
// ---------
m.set('normalize artist', (ctx, next) => {
  // skip if already set
  if (ctx.artistNorm) return next()

  ctx.artistNorm = normalizeStr(ctx.artist, ctx.cfg.articles)
  next()
})

m.set('normalize title', (ctx, next) => {
  // skip if already set
  if (ctx.titleNorm) return next()

  ctx.titleNorm = normalizeStr(ctx.title, ctx.cfg.articles)
  next()
})

// ---------------------
// end middleware stack
// ---------------------

// clean left-to-right until a valid part is encountered (or only 2 parts left)
function cleanParts (patterns) {
  return function (ctx, next) {
    for (let i = 0; i < ctx.parts.length; i++) {
      if (patterns.some(exp => exp.test(ctx.parts[i].trim())) && ctx.parts.length > 2) {
        ctx.parts.shift()
        i--
      } else break
    }

    next()
  }
}

function normalizeStr (str, articles) {
  str = removeArticles(str, articles)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(' & ', ' and ') // normalize ampersand
    .replace(/[^\w\s]|_/g, '') // remove punctuation

  return str
}

// move leading articles to end (but before any parantheses)
function moveArticles (str, articles) {
  if (!Array.isArray(articles)) return str

  for (const article of articles) {
    const search = article + ' '

    // leading article?
    if (new RegExp(`^${search}`, 'i').test(str)) {
      const parens = /[([{].*$/.exec(str)

      if (parens) {
        str = str.substring(search.length, parens.index - search.length)
          .trim() + `, ${article} ${parens[0]}`
      } else {
        str = str.substring(search.length) + `, ${article}`
      }

      // only replace one article per string
      continue
    }
  }

  return str.trim()
}

function removeArticles (str, articles) {
  for (const article of articles) {
    const leading = new RegExp(`^${article} `, 'i')
    const trailing = new RegExp(`, ${article}$`, 'i')

    if (leading.test(str)) {
      str = str.replace(leading, '')
      continue // only replace one article per string
    } else if (trailing.test(str)) {
      str = str.replace(trailing, '')
      continue // only replace one article per string
    }
  }

  return str.trim()
}
