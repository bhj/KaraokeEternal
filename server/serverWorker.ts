import getLogger from './lib/Log.js'
import path from 'path'
import getIPAddress from './lib/getIPAddress.js'
import http from 'http'
import fs from 'fs'
import { promisify } from 'util'
import parseCookie from './lib/parseCookie.js'
import jsonWebToken from 'jsonwebtoken'
import Koa from 'koa'
import koaRouter from '@koa/router'
import { koaBody } from 'koa-body'
import koaFavicon from 'koa-favicon'
import koaLogger from 'koa-logger'
import koaMount from 'koa-mount'
import koaRange from 'koa-range'
import koaStatic from 'koa-static'
import Media from './Media/Media.js'
import Prefs from './Prefs/Prefs.js'
import libraryRouter from './Library/router.js'
import mediaRouter from './Media/router.js'
import prefsRouter from './Prefs/router.js'
import roomsRouter from './Rooms/router.js'
import userRouter from './User/router.js'
import pushQueuesAndLibrary from './lib/pushQueuesAndLibrary.js'
import { Server as SocketIO } from 'socket.io'
import socketActions from './socket.js'
import IPC from './lib/IPCBridge.js'
import IPCLibraryActions from './Library/ipc.js'
import IPCMediaActions from './Media/ipc.js'
import IPCPrefsActions from './Prefs/ipc.js'
import { SCANNER_WORKER_EXITED, SERVER_WORKER_STATUS, SERVER_WORKER_ERROR } from '../shared/actionTypes.js'

const log = getLogger('server')
const { verify: jwtVerify } = jsonWebToken

async function serverWorker ({ env, startScanner, stopScanner, shutdownHandlers }) {
  const indexFile = path.join(env.KES_PATH_WEBROOT, 'index.html')
  const urlPath = env.KES_URL_PATH.replace(/\/?$/, '/') // force trailing slash
  const jwtKey = Prefs.getJwtKey(env.KES_ROTATE_KEY)
  const app = new Koa()
  let server, io

  // called when middleware is finalized
  function createServer () {
    server = http.createServer(app.callback())

    // http server error handler
    server.on('error', function (err) {
      log.error(err.message)

      ;(process as NodeJS.EventEmitter).emit('serverWorker', {
        type: SERVER_WORKER_ERROR,
        error: err.message,
      })

      // not much we can do without a working server
      throw err
    })

    // create socket.io server
    io = new SocketIO(server, {
      path: urlPath + 'socket.io',
      serveClient: false,
    })

    // attach socket.io handlers
    socketActions(io, jwtKey)

    // attach IPC action handlers
    IPC.use(IPCLibraryActions(io))
    IPC.use(IPCMediaActions(io))
    IPC.use(IPCPrefsActions(io))

    // success callback in 3rd arg
    server.listen(env.KES_PORT, () => {
      const port = server.address().port
      const url = `http://${getIPAddress()}${port === 80 ? '' : ':' + port}${urlPath}`
      log.info(`Web server running at ${url}`)

      ;(process as NodeJS.EventEmitter).emit('serverWorker', {
        type: SERVER_WORKER_STATUS,
        payload: { url },
      })
    })

    // when scanner exits cleanly
    process.on(SCANNER_WORKER_EXITED, ({ code }) => {
      if (code !== 0) return

      Media.cleanup()
      pushQueuesAndLibrary(io)
    })

    // handle shutdown gracefully
    shutdownHandlers.push(() => new Promise((resolve) => {
      // also calls http server's close method, which ultimately handles the callback
      io.close(resolve)

      // HMR keep-alive connections can prevent http server from fully closing
      server.closeAllConnections()
    }))
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
  app.use(koaLogger((str, args) => (args.length === 6 && args[3] >= 500) ? log.error(str) : log.debug(str)))

  app.use(koaFavicon(path.join(env.KES_PATH_ASSETS, 'favicon.ico')))
  app.use(koaRange)
  // Only /api routes ever read a body, so scope the parser there.
  // The public API routes (login/setup/signup) still parse before auth out of
  // necessity, so the limits below bound what an unauthenticated client can
  // force us to read. The client only ever sends JSON or multipart FormData,
  // so the urlencoded and text parsers are disabled entirely.
  app.use(koaMount(`${urlPath}api`, koaBody({
    multipart: true,
    urlencoded: false,
    text: false,
    jsonLimit: '16kb', // largest JSON bodies (room/prefs objects) are well under 1kb
    formidable: {
      maxFileSize: 128 * 1024, // only upload is the avatar; IMG_MAX_LENGTH (50KB)
      maxFiles: 1,
      maxFields: 12, // largest form (signup) sends 8 fields
      maxFieldsSize: 8 * 1024,
    },
  })))

  // all http requests
  app.use(async (ctx, next) => {
    ctx.jwtKey = jwtKey // used by login route

    // skip JWT/session validation if non-API request or logging in/out
    if (!ctx.request.path.startsWith(`${urlPath}api/`)
      || ctx.request.path === `${urlPath}api/login`
      || ctx.request.path === `${urlPath}api/logout`) {
      return next()
    }

    // verify JWT
    const { keToken } = parseCookie(ctx.request.header.cookie)

    try {
      const decoded = jwtVerify(keToken, jwtKey) as { exp?: number }
      // Reject tokens without an expiry (e.g. issued before JWT expiry existed).
      if (typeof decoded.exp !== 'number') throw new Error('token missing exp')
      ctx.user = decoded
    } catch {
      ctx.user = {
        dateUpdated: null,
        isAdmin: false,
        isGuest: false,
        name: null,
        roomId: null,
        userId: null,
        username: null,
      }

      // A token cookie was present but failed verification (expired / missing
      // exp / malformed): an authentication failure, not authorization. Clear
      // the dead cookie and flag the response so the client can redirect to
      // login instead of surfacing an error. A request with no token, or a
      // valid-but-unprivileged token, never reaches this branch.
      if (keToken) {
        ctx.cookies.set('keToken', '')
        ctx.set('X-Session-Expired', '1')
      }
    }

    // validated
    ctx.io = io
    ctx.startScanner = startScanner
    ctx.stopScanner = stopScanner

    await next()
  })

  // http api endpoints
  const baseRouter = new koaRouter({
    prefix: urlPath.replace(/\/$/, ''), // avoid double slashes with /api prefix
  })

  baseRouter.use(libraryRouter.routes())
  baseRouter.use(mediaRouter.routes())
  baseRouter.use(prefsRouter.routes())
  baseRouter.use(roomsRouter.routes())
  baseRouter.use(userRouter.routes())
  app.use(baseRouter.routes())

  // serve index.html with dynamic base tag at the main SPA routes
  const createIndexMiddleware = (content) => {
    const indexRoutes = [
      urlPath,
      ...['account', 'library', 'queue', 'player'].map(r => urlPath + r + '/'),
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
    app.use(koaMount(urlPath, koaStatic(env.KES_PATH_WEBROOT)))
    app.use(koaMount(`${urlPath}assets`, koaStatic(env.KES_PATH_ASSETS)))

    createServer()
    return
  }

  // ----------------------
  // Development middleware
  // ----------------------
  log.info('Enabling webpack dev and HMR middleware')
  const { default: webpack } = await import('webpack')
  // eslint-disable-next-line n/no-missing-import
  const { default: webpackConfig } = await import('../config/webpack.config.js')
  const compiler = webpack(webpackConfig)

  compiler.hooks.done.tap('indexPlugin', async () => {
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

  const { default: webpackDevMiddleware } = await import('webpack-dev-middleware')
  app.use(webpackDevMiddleware.koaWrapper(compiler, { publicPath: urlPath }))

  const { default: hotMiddleware } = await import('./lib/getHotMiddleware.js')
  app.use(hotMiddleware(compiler))

  // serve assets since webpack-dev-server is unaware of this folder
  app.use(koaMount(`${urlPath}assets`, koaStatic(env.KES_PATH_ASSETS)))
}

export default serverWorker
