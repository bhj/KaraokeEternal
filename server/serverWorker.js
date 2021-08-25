const log = require('./lib/Log').getLogger(`server[${process.pid}]`)
const path = require('path')
const getIPAddress = require('./lib/getIPAddress')
const http = require('http')
const fs = require('fs')
const { promisify } = require('util')
const parseCookie = require('./lib/parseCookie')
const jwtVerify = require('jsonwebtoken').verify
const Koa = require('koa')
const koaRouter = require('koa-router')
const koaBody = require('koa-body')
const koaFavicon = require('koa-favicon')
const koaLogger = require('koa-logger')
const koaMount = require('koa-mount')
const koaRange = require('koa-range')
const koaStatic = require('koa-static')

const Prefs = require('./Prefs')
const User = require('./User')
const YoutubeProcessManager = require('./Youtube/YoutubeProcessManager')
const libraryRouter = require('./Library/router')
const mediaRouter = require('./Media/router')
const prefsRouter = require('./Prefs/router')
const roomsRouter = require('./Rooms/router')
const userRouter = require('./User/router')
const youtubeRouter = require('./Youtube/router')
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
  const indexFile = path.join(env.KF_SERVER_PATH_WEBROOT, 'index.html')
  const urlPath = env.KF_SERVER_URL_PATH.replace(/\/?$/, '/') // force trailing slash
  const jwtKey = await Prefs.getJwtKey()
  const app = new Koa()
  let server, io

  // called when middleware is finalized
  function createServer () {
    server = http.createServer(app.callback())

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
    io = SocketIO(server, { serveClient: false })
    socketActions(io, jwtKey)

    // attach IPC action handlers
    IPC.use(IPCLibraryActions(io))
    IPC.use(IPCMediaActions(io))

    // start YouTube processing on startup (in case we shutdown in the middle of processing)...
    YoutubeProcessManager.startYoutubeProcessor()

    // success callback in 3rd arg
    server.listen(env.KF_SERVER_PORT, () => {
      const port = server.address().port
      const url = `http://${getIPAddress()}${port === 80 ? '' : ':' + port}${urlPath}`
      log.info(`Web server running at ${url}`)

      process.emit('serverWorker', {
        type: SERVER_WORKER_STATUS,
        payload: { url },
      })
    })
  }

  // --------------------
  // Begin Koa middleware
  // --------------------

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

  app.use(koaFavicon(path.join(env.KF_SERVER_PATH_ASSETS, 'favicon.ico')))
  app.use(koaRange)
  app.use(koaBody({ multipart: true }))

  // all http requests
  app.use(async (ctx, next) => {
    ctx.jwtKey = jwtKey // used by login route

    // skip JWT/session validation if non-API request or logging in/out
    if (!ctx.request.path.startsWith(`${urlPath}api/`) ||
      ctx.request.path === `${urlPath}api/login` ||
      ctx.request.path === `${urlPath}api/logout`) {
      return next()
    }

    // verify JWT
    try {
      const { kfToken } = parseCookie(ctx.request.header.cookie)
      ctx.user = jwtVerify(kfToken, jwtKey)
    } catch (err) {
      ctx.user = {
        dateUpdated: null,
        isAdmin: false,
        name: null,
        roomId: null,
        userId: null,
        username: null,
      }
    }

    // has account been modified since JWT was generated?
    if (typeof ctx.user.userId === 'number') {
      const user = await User.getById(ctx.user.userId)

      if (!user || user.dateUpdated !== ctx.user.dateUpdated) {
        // this seems to lead to an infinite loop, where no rooms are loaded, so you can't sign back in
        // ctx.throw(409, 'Session expired. Please sign in again.')
        // todo: send a message another way without causing no rooms to be returned?
      }
    }

    // validated
    ctx.io = io
    ctx.startScanner = startScanner
    ctx.stopScanner = stopScanner

    await next()
  })

  // http api endpoints
  const baseRouter = koaRouter({
    prefix: urlPath.replace(/\/$/, '') // avoid double slashes with /api prefix
  })

  baseRouter.use(libraryRouter.routes())
  baseRouter.use(mediaRouter.routes())
  baseRouter.use(prefsRouter.routes())
  baseRouter.use(roomsRouter.routes())
  baseRouter.use(userRouter.routes())
  baseRouter.use(youtubeRouter.routes())
  app.use(baseRouter.routes())

  // serve index.html with dynamic base tag at the main SPA routes
  const createIndexMiddleware = content => {
    const indexRoutes = [
      urlPath,
      ...['account', 'library', 'queue', 'player'].map(r => urlPath + r + '/')
    ]

    content = content.replace('<base href="/">', `<base href="${urlPath}">`)

    return async (ctx, next) => {
      // use a trailing slash for matching purposes
      const reqPath = ctx.request.path.replace(/\/?$/, '/')

      if (!indexRoutes.includes(reqPath)) {
        return next()
      }

      ctx.set('content-type', 'text/html')
      ctx.body = content
      ctx.status = 200
    }
  }

  if (env.NODE_ENV !== 'development') {
    // make sure we handle index.html before koaStatic,
    // otherwise it'll be served without dynamic base tag
    app.use(createIndexMiddleware(await promisify(fs.readFile)(indexFile, 'utf8')))

    // serve build and asset folders
    app.use(koaMount(urlPath, koaStatic(env.KF_SERVER_PATH_WEBROOT)))
    app.use(koaMount(`${urlPath}assets`, koaStatic(env.KF_SERVER_PATH_ASSETS)))

    createServer()
    return
  }

  // ----------------------
  // Development middleware
  // ----------------------
  log.info('Enabling webpack dev and HMR middleware')
  const webpack = require('webpack')
  const webpackConfig = require('../config/webpack.config')
  const compiler = webpack(webpackConfig)

  compiler.hooks.done.tap('indexPlugin', async (params) => {
    const indexContent = await new Promise((resolve, reject) => {
      compiler.outputFileSystem.readFile(indexFile, 'utf8', (err, result) => {
        if (err) return reject(err)
        return resolve(result)
      })
    })

    // @todo make this less hacky
    if (!server) {
      app.use(createIndexMiddleware(indexContent))
      createServer()
    }
  })

  const devMiddleware = require('./lib/getDevMiddleware')(compiler, { publicPath: urlPath })
  app.use(devMiddleware)

  const hotMiddleware = require('./lib/getHotMiddleware')(compiler)
  app.use(hotMiddleware)

  // serve assets since webpack-dev-server is unaware of this folder
  app.use(koaMount(`${urlPath}assets`, koaStatic(env.KF_SERVER_PATH_ASSETS)))
}

module.exports = serverWorker
