const sqlite = require('sqlite')
const log = require('debug')(`app:server [${process.pid}]`)
const path = require('path')
const project = require('../project.config')
const getIPAddress = require('./lib/getIPAddress')
const http = require('http')
const fs = require('fs')
const { promisify } = require('util')
const parseCookie = require('./lib/parseCookie')
const jwtVerify = require('jsonwebtoken').verify
const Koa = require('koa')
const KoaBodyparser = require('koa-bodyparser')
const KoaRange = require('koa-range')
const KoaLogger = require('koa-logger')
const KoaStatic = require('koa-static')
const app = new Koa()

const Prefs = require('./Prefs')
const Library = require('./Library')
const libraryRouter = require('./Library/router')
const mediaRouter = require('./Media/router')
const prefsRouter = require('./Prefs/router')
const roomsRouter = require('./Rooms/router')
const userRouter = require('./User/router')

const SocketIO = require('socket.io')
const socketActions = require('./socket')
const {
  LIBRARY_PUSH,
  SCANNER_WORKER_DONE,
  SERVER_WORKER_STATUS,
} = require('../shared/actions')

// Koa error handling
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = err.message
    ctx.app.emit('error', err, ctx)
  }
})

app.on('error', (err, ctx) => {
  log(err)
})

log('Opening database file %s', project.database)

Promise.resolve()
  .then(() => sqlite.open(project.database, { Promise }))
  .then(db => db.migrate({
    migrationsPath: path.join(project.basePath, 'server', 'lib', 'schemas'),
    // force: 'last' ,
  }))
  .then(() => Prefs.getJwtKey())
  .then(jwtKey => {
    // basic middleware
    app.use(KoaLogger())
    app.use(KoaRange)
    app.use(KoaBodyparser())

    // all http (koa) requests
    app.use(async (ctx, next) => {
      ctx.io = io
      ctx.jwtKey = jwtKey

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

    if (project.env === 'development') {
      log('Enabling webpack dev and HMR middleware')
      const webpack = require('webpack')
      const webpackConfig = require('../webpack.config')
      const compiler = webpack(webpackConfig)
      const KoaWebpack = require('koa-webpack')

      KoaWebpack({ compiler })
        .then((middleware) => {
          // webpack-dev-middleware and webpack-hot-client
          app.use(middleware)

          // serve static assets from ~/public since Webpack is unaware of these
          app.use(KoaStatic(path.resolve(project.basePath, 'public')))

          // "rewrite" other requests to the root /index.html file
          // (which webpack-dev-server will serve from a virtual ~/dist)
          const indexFile = path.join(project.basePath, 'dist', 'index.html')

          app.use(async (ctx, next) => {
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

      // serve files in ~/dist
      app.use(KoaStatic(path.join(project.basePath, 'dist')))

      // "rewrite" all other requests to the root /index.html file
      const indexFile = path.join(project.basePath, 'dist', 'index.html')
      const readFile = promisify(fs.readFile)

      app.use(async (ctx, next) => {
        ctx.body = await readFile(indexFile)
        ctx.set('content-type', 'text/html')
        ctx.status = 200
      })
    }

    // start koa and socket.io server
    const server = http.createServer(app.callback())
    const io = new SocketIO(server)

    // attach socket.io event handlers
    socketActions(io, jwtKey)

    // emit messages from scanner over socket.io
    process.on('message', async function (action) {
      io.emit('action', action)

      // emit library when scanner finishes/exits
      if (action.type === SCANNER_WORKER_DONE) {
        io.emit('action', {
          type: LIBRARY_PUSH,
          payload: await Library.get(),
        })
      }
    })

    server.listen(project.serverPort, project.serverHost, err => {
      if (err) throw err

      const url = `http://${getIPAddress()}:${project.serverPort}`
      log(`Web server running at ${url}`)

      process.send({
        'type': SERVER_WORKER_STATUS,
        'payload': { url },
      })
    })
  })
