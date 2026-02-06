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
import authRouter from './Auth/router.js'
import guestRouter from './Guest/router.js'
import libraryRouter from './Library/router.js'
import mediaRouter from './Media/router.js'
import prefsRouter from './Prefs/router.js'
import roomsRouter from './Rooms/router.js'
import userRouter from './User/router.js'
import hydraPresetsRouter from './HydraPresets/router.js'
import pushQueuesAndLibrary from './lib/pushQueuesAndLibrary.js'
import { Server as SocketIO } from 'socket.io'
import socketActions, { clearPendingCleanups } from './socket.js'
import IPC from './lib/IPCBridge.js'
import IPCLibraryActions from './Library/ipc.js'
import IPCMediaActions from './Media/ipc.js'
import { SCANNER_WORKER_EXITED, SERVER_WORKER_STATUS, SERVER_WORKER_ERROR } from '../shared/actionTypes.js'
import User from './User/User.js'
import Rooms from './Rooms/Rooms.js'
import { createProxyValidator } from './lib/proxyValidator.js'
import { isPublicApiPath } from './lib/publicPaths.js'

const log = getLogger('server')
const { verify: jwtVerify } = jsonWebToken

async function serverWorker ({ env, startScanner, stopScanner, shutdownHandlers }) {
  const indexFile = path.join(env.KES_PATH_WEBROOT, 'index.html')
  const urlPath = env.KES_URL_PATH.replace(/\/?$/, '/') // force trailing slash
  const jwtKey = await Prefs.getJwtKey(env.KES_ROTATE_KEY)
  const validateProxySource = createProxyValidator(env)
  const app = new Koa()

  // Trust proxy headers (X-Forwarded-Proto, etc.) when behind a reverse proxy
  // This allows secure cookies to work when TLS is terminated at the proxy
  // Set KES_TRUST_PROXY=true in your environment/NixOS config
  if (process.env.KES_TRUST_PROXY === 'true') {
    app.proxy = true
    log.info('KES_TRUST_PROXY enabled: trusting X-Forwarded-Proto header')
  }

  let server, io

  // called when middleware is finalized
  function createServer () {
    server = http.createServer(app.callback())

    // http server error handler
    server.on('error', function (err) {
      log.error(err.message)

      process.emit('serverWorker', {
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
      pingTimeout: 60000, // 60s (default 20s) - longer timeout for proxy environments
      pingInterval: 25000, // 25s (default 25s)
      transports: ['websocket', 'polling'], // prefer websocket, fallback to polling
    })

    // attach socket.io handlers
    socketActions(io, jwtKey, validateProxySource)

    // attach IPC action handlers
    IPC.use(IPCLibraryActions(io))
    IPC.use(IPCMediaActions(io))

    // success callback in 3rd arg
    server.listen(env.KES_PORT, () => {
      const port = server.address().port
      const url = `http://${getIPAddress()}${port === 80 ? '' : ':' + port}${urlPath}`
      log.info(`Web server running at ${url}`)

      process.emit('serverWorker', {
        type: SERVER_WORKER_STATUS,
        payload: { url },
      })
    })

    // when scanner exits cleanly
    process.on(SCANNER_WORKER_EXITED, async ({ code }) => {
      if (code !== 0) return

      await Media.cleanup()
      await pushQueuesAndLibrary(io)
    })

    // Cleanup idle ephemeral rooms every 30 minutes
    const IDLE_CLEANUP_INTERVAL_MS = 30 * 60 * 1000
    const idleCleanupInterval = setInterval(async () => {
      try {
        const idleRooms = await Rooms.getIdleEphemeral()
        for (const room of idleRooms) {
          log.info(`Cleaning up idle ephemeral room: ${room.roomId} (${room.name})`)
          await Rooms.delete(room.roomId)
        }
        if (idleRooms.length > 0) {
          log.info(`Cleaned up ${idleRooms.length} idle ephemeral room(s)`)
        }
      } catch (err) {
        log.error(`Error during idle room cleanup: ${err.message}`)
      }
    }, IDLE_CLEANUP_INTERVAL_MS)

    // Cleanup app-managed guests from closed rooms every hour
    const GUEST_CLEANUP_INTERVAL_MS = 60 * 60 * 1000
    const guestCleanupInterval = setInterval(async () => {
      try {
        await User.cleanupGuests()
      } catch (err) {
        log.error(`Error during guest cleanup: ${err.message}`)
      }
    }, GUEST_CLEANUP_INTERVAL_MS)

    // handle shutdown gracefully
    shutdownHandlers.push(() => new Promise((resolve) => {
      // Stop cleanup intervals
      clearInterval(idleCleanupInterval)
      clearInterval(guestCleanupInterval)

      // Clear pending room cleanup timeouts to prevent SQLITE_MISUSE errors
      clearPendingCleanups()

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
      // Sanitize error messages: only expose details for 4xx errors (user-facing)
      // 5xx errors should show generic message to clients, full details in logs
      if (ctx.status >= 500) {
        ctx.body = 'Internal server error'
      } else {
        ctx.body = err.message
      }
      ctx.app.emit('error', err, ctx)
    }
  })

  // http request/response logging
  app.use(koaLogger((str, args) => (args.length === 6 && args[3] >= 500) ? log.error(str) : log.debug(str)))

  app.use(koaFavicon(path.join(env.KES_PATH_ASSETS, 'favicon.ico')))
  app.use(koaRange)
  app.use(koaBody({ multipart: true }))

  // proxy source validation
  app.use(async (ctx, next) => {
    const remoteAddress = ctx.request.socket?.remoteAddress || ctx.ip
    if (!validateProxySource(remoteAddress)) {
      ctx.status = 403
      ctx.body = 'Direct access not permitted'
      return
    }
    await next()
  })

  // all http requests
  app.use(async (ctx, next) => {
    ctx.jwtKey = jwtKey // used by login route

    const path = ctx.request.path

    // Skip auth for static assets (performance optimization)
    if (path.startsWith(`${urlPath}assets/`)
      || /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i.test(path)) {
      return next()
    }

    // For non-API paths, no auth required (SPA serves index.html)
    // Also skip auth for login/logout endpoints
    if (!path.startsWith(`${urlPath}api/`)
      || path === `${urlPath}api/login`
      || path === `${urlPath}api/logout`) {
      return next()
    }

    const ephemeralEnabled = process.env.KES_EPHEMERAL_ROOMS !== 'false'

    // Verify JWT from cookie
    try {
      const { keToken } = parseCookie(ctx.request.header.cookie)
      const jwtPayload = jwtVerify(keToken, jwtKey) as {
        userId: number | null
        username: string | null
        name: string | null
        isAdmin: boolean
        isGuest: boolean
        roomId: number | null
        ownRoomId?: number | null
        dateUpdated: number | null
      }

      // Room visitation (standard users can visit other rooms)
      if (!jwtPayload.isGuest && ephemeralEnabled) {
        const visitedRoomId = ctx.cookies.get('keVisitedRoom')
        if (visitedRoomId) {
          const roomIdNum = parseInt(visitedRoomId, 10)
          if (!isNaN(roomIdNum) && roomIdNum !== jwtPayload.roomId) {
            try {
              await Rooms.validate(roomIdNum, null, { isOpen: true })
              jwtPayload.roomId = roomIdNum
              await Rooms.updateActivity(roomIdNum)
            } catch {
              ctx.cookies.set('keVisitedRoom', '', { maxAge: 0 })
            }
          }
        }
      }

      ctx.user = jwtPayload
    } catch {
      // No valid token - anonymous user
      ctx.user = {
        dateUpdated: null,
        isAdmin: false,
        isGuest: false,
        name: null,
        roomId: null,
        userId: null,
        username: null,
      }
    }

    ctx.io = io
    ctx.startScanner = startScanner
    ctx.stopScanner = stopScanner

    await next()
  })

  // API Gatekeeper: Return 401 for unauthenticated API requests (except public paths)
  // This enables OIDC auth flow - client gets 401 → redirects to /api/auth/login
  app.use(async (ctx, next) => {
    // Only gate API paths
    if (!ctx.path.startsWith(urlPath + 'api/')) {
      return next()
    }

    // Allow public API paths without authentication
    if (isPublicApiPath(ctx.path, urlPath)) {
      return next()
    }

    // Require authentication for all other API paths
    if (!ctx.user?.userId) {
      ctx.status = 401
      ctx.body = 'Unauthorized'
      return
    }

    await next()
  })

  // http api endpoints
  const baseRouter = new koaRouter({
    prefix: urlPath.replace(/\/$/, ''), // avoid double slashes with /api prefix
  })

  baseRouter.use(authRouter.routes())
  baseRouter.use(guestRouter.routes())
  baseRouter.use(libraryRouter.routes())
  baseRouter.use(mediaRouter.routes())
  baseRouter.use(prefsRouter.routes())
  baseRouter.use(roomsRouter.routes())
  baseRouter.use(userRouter.routes())
  baseRouter.use(hydraPresetsRouter.routes())
  app.use(baseRouter.routes())

  // serve index.html with dynamic base tag at the main SPA routes
  const createIndexMiddleware = (content) => {
    const indexRoutes = [
      urlPath,
      ...['account', 'library', 'queue', 'player', 'join', 'orchestrator', 'camera'].map(r => urlPath + r + '/'),
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
