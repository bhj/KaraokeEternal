const debug = require('debug')('app:server')
const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('../config/webpack.config')
const project = require('../config/project.config')
const readFile = require('./thunks/readfile')

const koa = require('koa')
const IO = require('koa-socket')
const convert = require('koa-convert')
const serve  = require('koa-static')
const koaBodyparser  = require('koa-bodyparser')
const koaJwt = require('koa-jwt')
const koaRange = require('koa-range')
const koaSocketIO = require('koa-socket')
const koaLogger = require('koa-logger')
const db = require('sqlite')

const apiRoutes = require('./api/http')
const socketActions = require('./api/socket')

const app = new koa()
const io = new IO()

app.use(koaLogger())
app.use(convert(koaRange))
app.use(koaBodyparser())

// decode jwt and make available as ctx.user
app.use(koaJwt({
  secret: 'shared-secret',
  passthrough: true,
}))

// initialize each module's koa-router routes
for (let route in apiRoutes) {
  app.use(apiRoutes[route].routes())
}

// make koa-socket available as app.io
// and the "real" socket.io instance as app._io
io.attach(app)

// koa-socket middleware
// note: ctx is not the same ctx as koa middleware
io.use(async (ctx, next) => {
  // make user, db and socket.io instance available
  // to downstream middleware and event listeners
  ctx.user = ctx.socket.socket.decoded_token || null
  ctx.db = db
  ctx.io = app._io

  await next()
})

// koa-socket event listener
io.on('action', socketActions)

// ------------------------------------
// Apply Webpack HMR Middleware
// ------------------------------------
if (project.env === 'development') {
  const compiler = webpack(webpackConfig)

  debug('Enabling webpack dev and HMR middleware')
  app.use(convert(require("koa-webpack-dev-middleware")(compiler, {
    publicPath  : webpackConfig.output.publicPath,
    contentBase : project.paths.client(),
    hot         : true,
    quiet       : project.compiler_quiet,
    noInfo      : project.compiler_quiet,
    lazy        : false,
    stats       : project.compiler_stats
  })))
  app.use(convert(require('koa-webpack-hot-middleware')(compiler, {
    path: '/__webpack_hmr'
  })))

  // Serve static assets from ~/public since Webpack is unaware of
  // these files. This middleware doesn't need to be enabled outside
  // of development since this directory will be copied into ~/dist
  // when the application is compiled.
  app.use(serve(project.paths.public()))

  // This rewrites all routes requests to the root /index.html file
  // (ignoring file requests). If you want to implement universal
  // rendering, you'll want to remove this middleware.
  app.use(async (ctx, next) => {
    const filename = path.join(compiler.outputPath, 'index.html')
    try {
      ctx.body = await readFile(compiler, filename)
      ctx.set('content-type', 'text/html')
      ctx.status = 200
      return Promise.resolve()
    } catch(err) {
      return Promise.reject(err)
    }
  })
} else {
  debug(
    'Server is being run outside of live development mode, meaning it will ' +
    'only serve the compiled application bundle in ~/dist. Generally you ' +
    'do not need an application server for this and can instead use a web ' +
    'server such as nginx to serve your static files. See the "deployment" ' +
    'section in the README for more information on deployment strategies.'
  )

  // Serving ~/dist by default. Ideally these files should be served by
  // the web server and not the app server, but this helps to demo the
  // server in production.
  app.use(serve(project.paths.dist()))
}

module.exports = app
