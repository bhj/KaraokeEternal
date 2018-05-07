const sqlite = require('sqlite')
const log = require('debug')(`app:server [${process.pid}]`)
const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('../webpack.config')
const project = require('../project.config')

const http = require('http')
const readFile = require('./lib/readFile')
const parseCookie = require('./lib/parseCookie')
const jwtVerify = require('jsonwebtoken').verify
const Koa = require('koa')
const KoaBodyparser = require('koa-bodyparser')
const KoaRange = require('koa-range')
const KoaLogger = require('koa-logger')
const KoaWebpack = require('koa-webpack')
const KoaStatic = require('koa-static')
const app = new Koa()

const libraryRouter = require('./Library/router')
const mediaRouter = require('./Media/router')
const prefsRouter = require('./Prefs/router')
const roomsRouter = require('./Rooms/router')
const userRouter = require('./User/router')

const SocketIO = require('socket.io')
const socketActions = require('./socket')

module.exports = function () {
  const dbFile = path.resolve(project.basePath, 'database.sqlite3')
  log('Opening database file %s', dbFile)

  Promise.resolve()
    .then(() => sqlite.open(dbFile, { Promise }))
    .then(db => db.migrate({
      migrationsPath: path.resolve('server', 'lib', 'db'),
      // force: 'last' ,
    }))

  app.use(KoaLogger())
  app.use(KoaRange)
  app.use(KoaBodyparser())

  // all http (koa) requests
  app.use(async (ctx, next) => {
    ctx.io = io

    // make JWT data available on ctx
    const { id_token } = parseCookie(ctx.request.header.cookie)

    try {
      ctx.user = jwtVerify(id_token, 'shared-secret')
    } catch (err) {
      ctx.user = {
        userId: null,
        username: null,
        name: null,
        isAdmin: false,
        roomId: null,
      }
    }

    await next()
  })

  // http api (koa-router) endpoints
  app.use(libraryRouter.routes())
  app.use(mediaRouter.routes())
  app.use(prefsRouter.routes())
  app.use(roomsRouter.routes())
  app.use(userRouter.routes())

  // Apply Webpack HMR Middleware
  // ------------------------------------
  if (project.env === 'development') {
    const compiler = webpack(webpackConfig)

    log('Enabling webpack dev and HMR middleware')

    app.use(KoaWebpack({
      compiler,
      dev: {
        stats       : 'minimal',
      },
    }))

    // Serve static assets from ~/public since Webpack is unaware of
    // these files. This middleware doesn't need to be enabled outside
    // of development since this directory will be copied into ~/dist
    // when the application is compiled.
    app.use(KoaStatic(path.resolve(project.basePath, 'public')))

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
      } catch (err) {
        return Promise.reject(err)
      }
    })
  } else {
    log(
      'Server is being run outside of live development mode, meaning it will ' +
      'only serve the compiled application bundle in ~/dist. Generally you ' +
      'do not need an application server for this and can instead use a web ' +
      'server such as nginx to serve your static files. See the "deployment" ' +
      'section in the README for more information on deployment strategies.'
    )

    // Serving ~/dist by default. Ideally these files should be served by
    // the web server and not the app server, but this helps to demo the
    // server in production.
    app.use(KoaStatic(path.resolve(project.basePath, project.outDir)))
  }

  // start koa and socket.io server
  const server = http.createServer(app.callback())
  const io = new SocketIO(server)

  // attach socket.io event handlers
  socketActions(io)

  // emit messages from scanner over socket.io
  process.on('message', function (action) {
    io.emit('action', action)
  })

  server.listen(project.serverPort)
  log(`Server listening on port ${project.serverPort}`)
}
