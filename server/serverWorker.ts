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
import socketActions, { clearPendingCleanups } from './socket.js'
import IPC from './lib/IPCBridge.js'
import IPCLibraryActions from './Library/ipc.js'
import IPCMediaActions from './Media/ipc.js'
import { SCANNER_WORKER_EXITED, SERVER_WORKER_STATUS, SERVER_WORKER_ERROR } from '../shared/actionTypes.js'
import User from './User/User.js'
import Rooms from './Rooms/Rooms.js'
import { createProxyValidator } from './lib/proxyValidator.js'

const { sign: jwtSign } = jsonWebToken

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
      pingTimeout: 60000,    // 60s (default 20s) - longer timeout for proxy environments
      pingInterval: 25000,   // 25s (default 25s)
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

    // handle shutdown gracefully
    shutdownHandlers.push(() => new Promise((resolve) => {
      // Stop idle cleanup interval
      clearInterval(idleCleanupInterval)

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

    // Skip SSO/auth processing for static assets (performance optimization)
    // These don't need cookies or authentication
    if (path.startsWith(`${urlPath}assets/`)
      || /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i.test(path)) {
      return next()
    }

    // SSO header auth (configurable headers)
    // IMPORTANT: Process for ALL requests (not just API) to set cookie on initial page load
    const authHeader = (process.env.KES_AUTH_HEADER || 'x-authentik-username').toLowerCase()
    const groupsHeader = (process.env.KES_GROUPS_HEADER || 'x-authentik-groups').toLowerCase()
    const adminGroup = process.env.KES_ADMIN_GROUP || 'admin'
    const guestGroup = process.env.KES_GUEST_GROUP || 'karaoke-guests'
    const roomIdHeader = (process.env.KES_ROOM_ID_HEADER || 'x-authentik-karaoke-room-id').toLowerCase()
    const ephemeralEnabled = process.env.KES_EPHEMERAL_ROOMS !== 'false'

    const headerUsername = ctx.request.header[authHeader]
    let ssoProcessed = false

    if (headerUsername && typeof headerUsername === 'string') {
      // Check if we need to process SSO (cookie missing or different user)
      // This prevents database hammering on every request
      let needsSsoProcessing = true
      const existingToken = ctx.cookies.get('keToken')

      if (existingToken) {
        try {
          const existingPayload = jwtVerify(existingToken, jwtKey) as { username: string }
          // Skip SSO if cookie already has the same user
          if (existingPayload.username === headerUsername.trim()) {
            needsSsoProcessing = false
            ctx.user = existingPayload
            ssoProcessed = true
          }
        } catch {
          // Invalid/expired token - need to reprocess SSO
        }
      }

      if (needsSsoProcessing) {
        try {
          // Check if user is admin/guest via groups header
          const groupsRaw = ctx.request.header[groupsHeader] || ''
          // Support both pipe (|) and comma (,) separators for groups (Authentik may use either)
          const groups = typeof groupsRaw === 'string' ? groupsRaw.split(/[,|]/).map(g => g.trim()).filter(g => g) : []
          const isAdmin = groups.includes(adminGroup)
          const isGuest = groups.includes(guestGroup)
          log.info('SSO auth: user=%s groups=%j isAdmin=%s isGuest=%s', headerUsername, groups, isAdmin, isGuest)
          // DEBUG: Log all x-authentik headers
          const authHeaders = Object.entries(ctx.request.header).filter(([k]) => k.toLowerCase().includes('authentik'))
          log.info('DEBUG x-authentik headers: %j', Object.fromEntries(authHeaders))
          log.info('DEBUG roomIdHeader=%s expected=%s', roomIdHeader, ctx.request.header[roomIdHeader])

          // Get or create user from header
          const user = await User.getOrCreateFromHeader(headerUsername, isAdmin, isGuest)

          let room

          if (isGuest) {
            // GUESTS: Use room from Authentik attribute header (set during enrollment)
            // Guests do NOT get their own ephemeral room
            const guestRoomIdRaw = ctx.request.header[roomIdHeader]
            // Defensive: header can be string or array
            const guestRoomId = Array.isArray(guestRoomIdRaw) ? guestRoomIdRaw[0] : guestRoomIdRaw

            if (guestRoomId) {
              const roomIdNum = parseInt(guestRoomId, 10)
              if (!isNaN(roomIdNum)) {
                try {
                  // Validate room: must exist, be open, and allow guests
                  await Rooms.validate(roomIdNum, null, { isOpen: true, role: 'guest' })
                  room = { roomId: roomIdNum }
                  await Rooms.updateActivity(roomIdNum)
                } catch (err) {
                  // Room validation failed - guest cannot join
                  log.warn('Guest %s cannot join room %d: %s', headerUsername, roomIdNum, (err as Error).message)
                  // Guest has no room - they'll see an error or be redirected
                }
              }
            }
            // If no valid room header or validation failed, guest has no room
          } else if (ephemeralEnabled) {
            // NON-GUESTS: Check for visitation cookie first
            const visitedRoomId = ctx.cookies.get('keVisitedRoom')

            if (visitedRoomId) {
              const roomIdNum = parseInt(visitedRoomId, 10)
              if (!isNaN(roomIdNum)) {
                try {
                  // CRITICAL: Validate room - prevents cookie spoofing attacks
                  // Room must exist AND be open (no password check via cookie)
                  await Rooms.validate(roomIdNum, null, { isOpen: true })
                  room = { roomId: roomIdNum }
                  await Rooms.updateActivity(roomIdNum)
                  log.info('User %s visiting room %d', headerUsername, roomIdNum)
                } catch (err) {
                  // "Locked Door" fail-safe: room closed/deleted while visiting
                  // Clear bad cookie, fall through to home room (no crash/403)
                  ctx.cookies.set('keVisitedRoom', '', { maxAge: 0 })
                  log.info('Cleared invalid visitation cookie for user %s: %s', headerUsername, (err as Error).message)
                }
              }
            }

            // Default: own ephemeral room (home base)
            if (!room) {
              room = await Rooms.getByOwnerId(user.userId)
              if (!room) {
                const roomId = await Rooms.createEphemeral(user.userId, user.username)
                room = { roomId }
              } else {
                await Rooms.updateActivity(room.roomId)
              }
            }
          }

          // Get user's own room ID (for tracking visiting state)
          let ownRoomId: number | null = null
          if (ephemeralEnabled && !isGuest) {
            const ownRoom = await Rooms.getByOwnerId(user.userId)
            ownRoomId = ownRoom?.roomId ?? null
          }

          // Build JWT payload - admin from groups header takes precedence
          const jwtPayload = {
            userId: user.userId,
            username: user.username,
            name: user.name,
            isAdmin: isAdmin || user.role === 'admin',
            isGuest: isGuest || user.role === 'guest',
            roomId: room?.roomId ?? null,
            ownRoomId,
            dateUpdated: user.dateUpdated,
          }

          // Set JWT cookie (httpOnly for security, secure in production)
          const token = jwtSign(jwtPayload, jwtKey)
          const isSecure = env.NODE_ENV === 'production' || env.KES_REQUIRE_PROXY === 'true'
          ctx.cookies.set('keToken', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isSecure,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          })

          ctx.user = jwtPayload
          ssoProcessed = true
        } catch (err) {
          log.error(`Header auth failed: ${err.message}`)
          // Fall through to JWT verification for API paths
        }
      }
    }

    // For non-API paths (and login/logout), we're done - no auth required
    // The cookie has been set if SSO headers were present
    if (!path.startsWith(`${urlPath}api/`)
      || path === `${urlPath}api/login`
      || path === `${urlPath}api/logout`) {
      return next()
    }

    // For API paths: if SSO didn't process, verify JWT from cookie
    if (!ssoProcessed) {
      try {
        const { keToken } = parseCookie(ctx.request.header.cookie)
        // Type assertion to match expected user context shape
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

        // Check for room visitation cookie (allows standard users to visit other rooms)
        // Only non-guests can visit other rooms - guests are bound to their enrollment room
        if (!jwtPayload.isGuest && ephemeralEnabled) {
          const visitedRoomId = ctx.cookies.get('keVisitedRoom')
          if (visitedRoomId) {
            const roomIdNum = parseInt(visitedRoomId, 10)
            if (!isNaN(roomIdNum) && roomIdNum !== jwtPayload.roomId) {
              try {
                // Validate room exists and is open
                await Rooms.validate(roomIdNum, null, { isOpen: true })
                // Update roomId in the user context for this request
                jwtPayload.roomId = roomIdNum
                await Rooms.updateActivity(roomIdNum)
                log.verbose('JWT user %s visiting room %d', jwtPayload.username, roomIdNum)
              } catch (err) {
                // Room no longer valid - clear cookie silently
                ctx.cookies.set('keVisitedRoom', '', { maxAge: 0 })
                log.info('Cleared invalid visitation cookie for user %s: %s', jwtPayload.username, (err as Error).message)
              }
            }
          }
        }

        ctx.user = jwtPayload
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
