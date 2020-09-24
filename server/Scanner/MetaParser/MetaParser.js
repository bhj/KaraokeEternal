const { composeSync } = require('ctx-compose')
const defaultMiddleware = require('./defaultMiddleware')
const defaultParser = compose(...defaultMiddleware.values())

function compose (...args) {
  const flattened = args.reduce(
    (accumulator, currentValue) => accumulator.concat(currentValue), []
  )

  return composeSync(flattened)
}

// default parser creator
function getDefaultParser (cfg = {}) {
  if (typeof cfg.articles === 'undefined') {
    cfg.articles = ['A', 'An', 'The']
  }

  return (ctx, next) => {
    Object.assign(ctx.cfg, cfg)
    return defaultParser(ctx, next)
  }
}

class MetaParser {
  constructor (cfg = {}) {
    const parser = typeof cfg === 'function'
      ? cfg({ compose, getDefaultParser, defaultMiddleware })
      : getDefaultParser(cfg)

    return input => {
      const ctx = { ...input, cfg }
      parser(ctx)

      if (!ctx.artist || !ctx.title) {
        throw new Error('could not determine artist or title')
      }

      return {
        artist: ctx.artist,
        artistNorm: ctx.artistNorm || ctx.artist,
        title: ctx.title,
        titleNorm: ctx.titleNorm || ctx.title,
      }
    }
  }
}

module.exports = MetaParser
