// based on https://github.com/tnnevol/webpack-hot-middleware-for-koa2

import webpackHotMiddleware from 'webpack-hot-middleware'

export default (compiler, opts?) => {
  const middleware = webpackHotMiddleware(compiler, opts)

  return async (ctx, next) => {
    const { end: originalEnd } = ctx.res

    const runNext = await new Promise((resolve) => {
      ctx.res.end = function (...args) {
        originalEnd.apply(this, args)
        resolve(false)
      }

      // call express-style middleware
      middleware(ctx.req, ctx.res, () => {
        resolve(true)
      })
    })

    if (runNext) {
      await next()
    }
  }
}
