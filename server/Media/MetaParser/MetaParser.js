const defaultMiddleware = require('./defaultMiddleware')
const { composeSync } = require('ctx-compose')

class MetaParser {
  constructor (cfg) {
    function getDefaultMiddleware (cfg) {
      return defaultMiddleware(cfg)
    }

    function getDefaultParser (cfg) {
      const middleware = getDefaultMiddleware(cfg)
      return composeSync(Object.keys(middleware).map(
        key => composeSync(middleware[key])
      ))
    }

    const parser = typeof cfg === 'function'
      ? cfg({ composeSync, getDefaultMiddleware, getDefaultParser })
      : getDefaultParser(cfg)

    return str => {
      const ctx = { str, cfg }
      parser(ctx)

      if (!ctx.artist || !ctx.title) {
        throw new Error('Could not determine artist or title')
      }

      return { artist: ctx.artist, title: ctx.title }
    }
  }
}

module.exports = MetaParser
