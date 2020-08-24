const log = require('./lib/logger')(`server[${process.pid}]`)
const path = require('path')
const config = require('../project.config')
const getIPAddress = require('./lib/getIPAddress')
const http = require('http')
const fs = require('fs')
const { promisify } = require('util')
const parseCookie = require('./lib/parseCookie')
const jwtVerify = require('jsonwebtoken').verify
const Koa = require('koa')
const koaBody = require('koa-body')
const koaFavicon = require('koa-favicon')
const koaLogger = require('koa-logger')
const koaMount = require('koa-mount')
const koaRange = require('koa-range')
const koaStatic = require('koa-static')

const Prefs = require('./Prefs')
const libraryRouter = require('./Library/router')
const mediaRouter = require('./Media/router')
const prefsRouter = require('./Prefs/router')
const roomsRouter = require('./Rooms/router')
const userRouter = require('./User/router')
const SocketIO = require('socket.io')
const socketActions = require('./socket')
const IPC = require('./lib/IPCBridge')
const IPCLibraryActions = require('./Library/ipc')
const IPCMediaActions = require('./Media/ipc')
const {
  SERVER_WORKER_STATUS,
  SERVER_WORKER_ERROR,
} = require('../shared/actionTypes')

async function serverWorker ({ env, startScanner, stopScanner }) {
  const jwtKey = await Prefs.getJwtKey()
  const app = new Koa()

  // server error handler
  app.on('error', (err, ctx) => {
    if (err.code === 'EPIPE') {
      // these are common since browsers make multiple requests for media files
      log.verbose(err.message)
      return
    }

    // silence 4xx response "errors" (koa-logger should show these anyway)
    if (ctx.response && ctx.response.status.toString().startsWith('4')) {
      return
    }

    if (err.stack) log.error(err.stack)
    else log.error(err)
  })

  // middleware error handler
  app.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      ctx.status = err.status || 500
      ctx.body = err.message
      ctx.app.emit('error', err, ctx)
    }
  })

  // http request/response logging
  app.use(koaLogger((str, args) => (args.length === 6 && args[3] >= 500) ? log.error(str) : log.verbose(str)))

  app.use(koaFavicon(path.join(config.assetPath, 'favicon.ico')))
  app.use(koaRange)
  app.use(koaBody({ multipart: true }))

  // all http requests
  app.use(async (ctx, next) => {
    ctx.io = io
    ctx.jwtKey = jwtKey
    ctx.startScanner = startScanner
    ctx.stopScanner = stopScanner

    // verify jwt
    try {
      const { kfToken } = parseCookie(ctx.request.header.cookie)
      ctx.user = jwtVerify(kfToken, jwtKey)
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

  // @todo these could be read dynamically from src/routes
  // but should probably wait for react-router upgrade?
  const rewriteRoutes = ['account', 'library', 'queue', 'player']
  const indexFile = path.join(config.buildPath, 'index.html')

  if (config.env === 'development') {
    log.info('Enabling webpack dev and HMR middleware')
    const webpack = require('webpack')
    const webpackConfig = require('../webpack.config')
    const compiler = webpack(webpackConfig)
    const koaWebpack = require('koa-webpack')

    koaWebpack({ compiler })
      .then((middleware) => {
        // webpack-dev-middleware and webpack-hot-client
        app.use(middleware)

        // serve /assets since webpack-dev-server is unaware of this folder
        app.use(koaMount('/assets', koaStatic(config.assetPath)))

        // "rewrite" top level SPA routes to index.html
        app.use(async (ctx, next) => {
          const route = ctx.request.path.substring(1).split('/')[0]
          if (!rewriteRoutes.includes(route)) return next()

          ctx.body = await new Promise(function (resolve, reject) {
            compiler.outputFileSystem.readFile(indexFile, (err, result) => {
              if (err) { return reject(err) }
              return resolve(result)
            })
          })
          ctx.set('content-type', 'text/html')
          ctx.status = 200
        })
      })
  } else {
    // production mode
    // serve build folder as webroot
    app.use(koaStatic(config.buildPath))
    app.use(koaMount('/assets', koaStatic(config.assetPath)))

    // "rewrite" top level SPA routes to index.html
    const readFile = promisify(fs.readFile)

    app.use(async (ctx, next) => {
      const route = ctx.request.path.substring(1).split('/')[0]
      if (!rewriteRoutes.includes(route)) return next()

      ctx.body = await readFile(indexFile)
      ctx.set('content-type', 'text/html')
      ctx.status = 200
    })
  } // end if

  // create http server
  const server = http.createServer(app.callback())

  // http server error handler
  server.on('error', function (err) {
    log.error(err)

    process.emit('serverWorker', {
      type: SERVER_WORKER_ERROR,
      error: err.message,
    })

    // not much we can do without a working server
    process.exit(1)
  })

  // create socket.io server and attach handlers
  const io = new SocketIO(server)
  socketActions(io, jwtKey)

  // attach IPC action handlers
  IPC.use(IPCLibraryActions(io))
  IPC.use(IPCMediaActions(io))

  log.info(`Starting web server (host=${env.KF_SERVER_HOST}; port=${env.KF_SERVER_PORT})`)

  // success callback in 3rd arg
  server.listen(env.KF_SERVER_PORT, env.KF_SERVER_HOST, () => {
    const port = server.address().port
    const url = `http://${getIPAddress()}` + (port === 80 ? '' : ':' + port)
    log.info(`Web server running at ${url}`)

    process.emit('serverWorker', {
      type: SERVER_WORKER_STATUS,
      payload: { url },
    })
  })
}

module.exports = serverWorker
