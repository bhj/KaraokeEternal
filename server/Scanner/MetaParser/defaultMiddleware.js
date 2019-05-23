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
  // remove text having 'karaoke' between (), [], or {}
  ctx.name = ctx.name.replace(/[([{](?=[^([{]*$).*karaoke.*[)\]}]/i, '')
  next()
})

// --------------
// parse
// --------------

// detect separator and set some (default) config
m.set('detect separator', (ctx, next) => {
  const matches = ctx.name.match(/ in the style of /i)

  ctx.cfg = {
    separator: matches ? matches[0] : '-',
    artistOnLeft: !matches,
    ...ctx.cfg,
  }

  next()
})

// split to parts
m.set('split to parts', (ctx, next) => {
  // split, trim and remove empty parts
  ctx.parts = ctx.name.split(ctx.cfg.separator)
    .map(part => part.trim())
    .filter(part => part.length)

  next()
})

m.set('remove parts', cleanParts([
  /^\d*\.?$/, // looks like a track number?
  /^\W*$/, // all non-word chars?
  /^[a-zA-Z]{2,4}\d{1,}/i, // starts with 2-4 letters followed by 1 or more digits
]))

// set arist and title properties
m.set('set artist and title', (ctx, next) => {
  // skip if already set
  if (ctx.artist || ctx.title) return next()

  // @todo this assumes delimiter won't appear in title
  ctx.title = ctx.cfg.artistOnLeft ? ctx.parts.pop() : ctx.parts.shift()
  ctx.artist = ctx.parts.join(ctx.cfg.separator)

  next()
})

// -----------
// post
// -----------

// remove any surrounding quotes
m.set('remove surrounding quotes', (ctx, next) => {
  ctx.artist = ctx.artist.replace(/^['|"](.*)['|"]$/, '$1')
  ctx.title = ctx.title.replace(/^['|"](.*)['|"]$/, '$1')
  next()
})

// title case
m.set('title case', (ctx, next) => {
  ctx.artist = titleCase(ctx.artist)
  ctx.title = titleCase(ctx.title)
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
  if (!ctx.artistNorm) {
    ctx.artistNorm = normalizeStr(ctx.artist, ctx.cfg.articles)
  }

  next()
})

m.set('normalize title', (ctx, next) => {
  // skip if already set
  if (!ctx.titleNorm) {
    ctx.titleNorm = normalizeStr(ctx.title, ctx.cfg.articles)
  }

  next()
})

// ---------------------
// end middleware stack
// ---------------------

function cleanParts (patterns) {
  return function (ctx, next) {
    ctx.parts = ctx.parts.filter(part => {
      if (ctx.parts.length < 3) return true
      return !patterns.some(exp => !part.replace(exp, '').trim())
    })

    next()
  }
}

function titleCase (str) {
  return str.replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.substr(1)
  })
}

function normalizeStr (str, articles) {
  str = str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[([{].*[)\]}]/, '') // remove parantheses
    .replace(' & ', ' and ') // normalize ampersand
    .trim()

  str = removeArticles(str, articles)
    .replace(/-/, ' ') // any remaining hyphens become spaces
    .replace(/[^\w\s]|_/g, '') // remove punctuation

  return str
}

// move leading articles to end (but before any parantheses)
function moveArticles (str, articles) {
  if (!Array.isArray(articles)) return str

  for (let article of articles) {
    const search = article + ' '

    // leading article?
    if (new RegExp(`^${search}`, 'i').test(str)) {
      const parens = /[([{].*$/.exec(str)

      if (parens) {
        str = str.substr(search.length, parens.index - search.length)
          .trim() + `, ${article} ${parens[0]}`
      } else {
        str = str.substr(search.length) + `, ${article}`
      }

      // only replace one article per string
      continue
    }
  }

  return str.trim()
}

function removeArticles (str, articles) {
  for (let article of articles) {
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
