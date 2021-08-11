/*
  Copyright © 2016 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const webpackDevMiddleware = require('webpack-dev-middleware')

module.exports = (compiler, opts) => {
  const middleware = webpackDevMiddleware(compiler, opts)

  return (ctx, next) => {
    // wait for webpack-dev-middleware to signal that the build is ready
    const ready = new Promise((resolve, reject) => {
      for (const comp of [].concat(compiler.compilers || compiler)) {
        comp.hooks.failed.tap('KoaWebpack', (error) => {
          reject(error)
        })
      }

      middleware.waitUntilValid(() => {
        resolve(true)
      })
    })

    // tell webpack-dev-middleware to handle the request
    const init = new Promise((resolve) => {
      // call express-style middleware
      middleware(
        ctx.req,
        {
          end: (content) => {
            // eslint-disable-next-line no-param-reassign
            ctx.body = content
            resolve()
          },
          getHeader: ctx.get.bind(ctx),
          setHeader: ctx.set.bind(ctx),
          locals: ctx.state
        },
        () => resolve(next())
      )
    })

    return Promise.all([ready, init])
  }
}
