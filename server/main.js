import Koa from 'koa'
import convert from 'koa-convert'
import webpack from 'webpack'
import webpackConfig from '../build/webpack.config'
import historyApiFallback from 'koa-connect-history-api-fallback'
import serve from 'koa-static'
import proxy from 'koa-proxy'
import _debug from 'debug'
import config from '../config'
import webpackDevMiddleware from './middleware/webpack-dev'
import webpackHMRMiddleware from './middleware/webpack-hmr'
import bodyparser from 'koa-bodyparser'
import sqlite3 from 'co-sqlite3'
import jwt from 'koa-jwt'
import apiRoutes from './api/routes'
import apiSockets from './api/sockets'
import KoaRange from 'koa-range'
import KoaSocketIO from 'koa-socket'

const debug = _debug('app:server')
const paths = config.utils_paths
const app = new Koa()
const io = new KoaSocketIO()

// initialize database
let _dbInstance

sqlite3(config.path_database).then((db)=>{
  debug('SQLite3 database initialized at: %s', config.path_database)
  _dbInstance = db
})

// make database available on koa ctx
app.use(async (ctx, next) => {
    ctx.db = _dbInstance
    await next()
});

app.use(convert(KoaRange))

app.use(bodyparser())

// decode jwt and make available as ctx.user
app.use(convert(
  jwt({secret: 'shared-secret', cookie: 'id_token', passthrough: true})
))

// initialize each module's koa-router routes
for (let route in apiRoutes) {
  app.use(apiRoutes[route].routes())
}

// make koa-socket available as app.io
// and the "real" socket.io instance as app._io
io.attach(app)

// koa-socket middleware (note: ctx is
// not the same ctx as koa middleware)
io.use(async (ctx, next) => {
  // make db and socket.io instance
  // available to downstream middleware
  ctx.db = _dbInstance
  ctx.io = app._io
  await next()
})

// apply koa-socket middlewares
for (let handler in apiSockets) {
  io.on('action', apiSockets[handler])
}

// Enable koa-proxy if it has been enabled in the config.
if (config.proxy && config.proxy.enabled) {
  app.use(convert(proxy(config.proxy.options)))
}

// This rewrites all routes requests to the root /index.html file
// (ignoring file requests). If you want to implement isomorphic
// rendering, you'll want to remove this middleware.
app.use(convert(historyApiFallback({
  verbose: false
})))

// ------------------------------------
// Apply Webpack HMR Middleware
// ------------------------------------
if (config.env === 'development') {
  const compiler = webpack(webpackConfig)

  // Enable webpack-dev and webpack-hot middleware
  const { publicPath } = webpackConfig.output

  app.use(webpackDevMiddleware(compiler, publicPath))
  app.use(webpackHMRMiddleware(compiler))

  // Serve static assets from ~/src/static since Webpack is unaware of
  // these files. This middleware doesn't need to be enabled outside
  // of development since this directory will be copied into ~/dist
  // when the application is compiled.
  app.use(convert(serve(paths.client('static'))))
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
  app.use(convert(serve(paths.dist())))
}

export default app
