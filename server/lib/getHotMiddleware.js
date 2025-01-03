// based on https://github.com/tnnevol/webpack-hot-middleware-for-koa2

// eslint-disable-next-line n/no-unpublished-import
import webpackHotMiddleware from 'webpack-hot-middleware'

export default (compiler, opts) => {
  const middleware = webpackHotMiddleware(compiler, opts)

  return async (ctx, next) => {
    const { end: originalEnd } = ctx.res

    const runNext = await new Promise((resolve) => {
      ctx.res.end = function () {
        originalEnd.apply(this, arguments)
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
