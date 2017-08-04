const debug = require('debug')('app:server')
const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('../build/webpack.config')
const project = require('../project.config')
const readFile = require('./lib/async/readfile')

const Koa = require('koa')
const KoaWebpack = require('koa-webpack')
const KoaSocket = require('koa-socket')
const KoaStatic = require('koa-static')
const KoaBodyparser = require('koa-bodyparser')
const KoaRange = require('koa-range')
const KoaLogger = require('koa-logger')
const jwtVerify = require('jsonwebtoken').verify

const httpRoutes = require('./http')
const socketActions = require('./socket')
const getLibrary = require('./lib/getLibrary')
const getQueue = require('./lib/getQueue')
const {
  LIBRARY_UPDATE,
  QUEUE_UPDATE,
  SOCKET_AUTH_ERROR,
  PLAYER_ENTER,
  PLAYER_LEAVE,
} = require('./constants')

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  debug('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

const app = new Koa()
const io = new KoaSocket()

app.use(KoaLogger())
app.use(KoaRange)
app.use(KoaBodyparser())

// all http (koa) requests
app.use(async (ctx, next) => {
  // make JWT data available on ctx
  const { id_token } = parseCookie(ctx.request.header.cookie)

  try {
    ctx.user = jwtVerify(id_token, 'shared-secret')
  } catch (err) {
    ctx.user = {
      userId: null,
      email: null,
      name: null,
      isAdmin: false,
      roomId: null,
    }
  }

  // make socket.io server (not koa-socket) available on ctx
  ctx._io = app._io

  await next()
})

// http api (koa-router) endpoints
for (const route in httpRoutes) {
  app.use(httpRoutes[route].routes())
}

// makes koa-socket available as app.io
// and the "real" socket.io instance as app._io
io.attach(app)

app._io.on('connection', async (sock) => {
  const { id_token } = parseCookie(sock.handshake.headers.cookie)
  let user, room

  try {
    sock.decoded_token = jwtVerify(id_token, 'shared-secret')
  } catch (err) {
    app._io.to(sock.id).emit('action', {
      type: SOCKET_AUTH_ERROR,
      meta: {
        error: `${err.message} (try signing in again)`
      }
    })

    sock.decoded_token = null
    sock.disconnect()
    return
  }

  // authentication successful
  user = sock.decoded_token

  // add user to socket room
  sock.join(user.roomId)

  room = sock.adapter.rooms[user.roomId]

  debug('%s (%s) joined room %s (%s in room)',
    user.name, sock.id, user.roomId, room.length
  )

  // send queue
  try {
    app._io.to(sock.id).emit('action', {
      type: QUEUE_UPDATE,
      payload: await getQueue(user.roomId),
    })
  } catch (err) {
    debug(err)
  }

  // send library
  try {
    app._io.to(sock.id).emit('action', {
      type: LIBRARY_UPDATE,
      payload: await getLibrary(),
    })
  } catch (err) {
    debug(err)
  }

  // player in room?
  const hasPlayer = Object.keys(room.sockets).some(id => {
    return app._io.sockets.sockets[id]._isPlayer === true
  })

  if (hasPlayer) {
    app._io.to(user.roomId).emit('action', {
      type: PLAYER_ENTER,
    })
  }
})

// koa-socket middleware
// makes user and socket.io instance available
// to downstream middleware and event listeners
// note: ctx is not the same ctx as koa middleware
io.use(async (ctx, next) => {
  // koa-socket puts socket instances behind
  // cleverly named 'socket' property...
  ctx.sock = ctx.socket.socket
  ctx.user = ctx.sock.decoded_token || null

  await next()
})

// koa-socket (socket.io) api actions
io.on('action', socketActions)

// log disconnect/leave
io.on('disconnect', (ctx, data) => {
  const user = ctx.user

  if (!user || !user.roomId) {
    return
  }

  const sock = ctx.socket.socket
  const room = sock.adapter.rooms[user.roomId] || []

  debug('%s (%s) left room %s (%s in room)',
    user.name, sock.id, user.roomId, room.length
  )

  if (sock._isPlayer && room.length) {
    // any other players left in room?
    const hasPlayer = Object.keys(room.sockets).some(id => {
      return app._io.sockets.sockets[id]._isPlayer === true
    })

    if (!hasPlayer) {
      app._io.to(user.roomId).emit('action', {
        type: PLAYER_LEAVE,
      })
    }
  }
})

// ------------------------------------
// Apply Webpack HMR Middleware
// ------------------------------------
if (project.env === 'development') {
  const compiler = webpack(webpackConfig)

  debug('Enabling webpack dev and HMR middleware')

  app.use(KoaWebpack({
    compiler,
    dev: {
      publicPath  : webpackConfig.output.publicPath,
      contentBase : path.resolve(project.basePath, project.srcDir),
      hot         : true,
      quiet       : false,
      noInfo      : false,
      lazy        : false,
      stats       : 'normal',
    },
    hot: {
      path: '/__webpack_hmr'
    }
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
  app.use(KoaStatic(path.resolve(project.basePath, project.outDir)))
}

module.exports = app

// cookie helper based on
// http://stackoverflow.com/questions/3393854/get-and-set-a-single-cookie-with-node-js-http-server
function parseCookie (cookie) {
  const list = {}

  cookie && cookie.split(';').forEach(c => {
    const parts = c.split('=')
    list[parts.shift().trim()] = decodeURI(parts.join('='))
  })

  return list
}
