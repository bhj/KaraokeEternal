const koa = require('koa')
const IO = require('koa-socket')
const debug = require('debug')('app:server')
const webpack = require('webpack')
const webpackConfig = require('../build/webpack.config')
const config = require('../config')
const paths = config.utils_paths

const convert = require('koa-convert')
const serve  = require('koa-static')
const bodyparser  = require('koa-bodyparser')
const db = require('sqlite')
const koaJwt = require('koa-jwt')
const koaRange = require('koa-range')
const koaSocketIO = require('koa-socket')

const apiRoutes = require('./api/routes')
const socketActions = require('./api/sockets')

const app = new koa()
const io = new IO()

// initialize database
Promise.resolve()
  // @todo ensure this happens before listen()
  .then(() => {
    db.open(config.path_database, { Promise })
    debug('SQLite3 database opened: %s', config.path_database)
  })
  .catch(err => debug(err.stack))

// make database available on koa ctx
app.use(async (ctx, next) => {
    ctx.db = db
    await next()
})

app.use(convert(koaRange))
app.use(bodyparser())

// decode jwt and make available as ctx.user
app.use(convert(koaJwt({
  secret: 'shared-secret',
  passthrough: true,
})))

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

// This rewrites all routes requests to the root /index.html file
// (ignoring file requests). If you want to implement universal
// rendering, you'll want to remove this middleware.
app.use(convert(require('koa-connect-history-api-fallback')()))

// ------------------------------------
// Apply Webpack HMR Middleware
// ------------------------------------
if (config.env === 'development') {
  const compiler = webpack(webpackConfig)

  debug('Enable webpack dev and HMR middleware')
  app.use(convert(require("koa-webpack-dev-middleware")(compiler, {
    publicPath  : webpackConfig.output.publicPath,
    contentBase : paths.client(),
    hot         : true,
    quiet       : config.compiler_quiet,
    noInfo      : config.compiler_quiet,
    lazy        : false,
    stats       : config.compiler_stats
  })))
  app.use(convert(require('koa-webpack-hot-middleware')(compiler)))

  // Serve static assets from ~/src/static since Webpack is unaware of
  // these files. This middleware doesn't need to be enabled outside
  // of development since this directory will be copied into ~/dist
  // when the application is compiled.
  app.use(serve(paths.client('static')))
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
  app.use(serve(paths.dist()))
}

module.exports = exports = app
