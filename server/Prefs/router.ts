import path from 'path'
import getLogger from '../lib/Log.js'
import KoaRouter from '@koa/router'
import getFolders from '../lib/getFolders.js'
import getWindowsDrives from '../lib/getWindowsDrives.js'
import Prefs from './Prefs.js'
import Media from '../Media/Media.js'
import pushQueuesAndLibrary from '../lib/pushQueuesAndLibrary.js'
import Rooms from '../Rooms/Rooms.js'
import Queue from '../Queue/Queue.js'
import { PREFS_PATHS_CHANGED, QUEUE_PUSH } from '../../shared/actionTypes.js'
import type { Prefs as PrefsType } from '../../shared/types.js'

interface RequestWithBody {
  body: Record<string, unknown>
}

const log = getLogger('Prefs')
const router = new KoaRouter({ prefix: '/api/prefs' })

// get all prefs (including media paths)
router.get('/', async (ctx) => {
  const prefs = await Prefs.get() as unknown as PrefsType

  // must be admin or firstrun
  if (prefs.isFirstRun || ctx.user.isAdmin) {
    ctx.body = prefs
    return
  }

  // non-admins only get roles
  ctx.body = { roles: prefs.roles }
})

// add a media path
router.post('/path', async (ctx) => {
  const dir = decodeURIComponent(ctx.query.dir as string)

  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  // required
  if (!dir) {
    ctx.throw(422, 'Invalid path')
  }

  const pathId = await Prefs.addPath(dir, {
    prefs: (ctx.request as unknown as RequestWithBody).body,
  })

  // respond with updated prefs
  const prefs = await Prefs.get() as unknown as PrefsType
  ctx.body = prefs

  // (re)start watcher
  process.emit(PREFS_PATHS_CHANGED, prefs.paths)

  ctx.startScanner(pathId)
})

// set media path preferences
router.put('/path/:pathId', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const pathId = parseInt(ctx.params.pathId, 10)

  if (isNaN(pathId)) {
    ctx.throw(422, 'Invalid pathId')
  }

  await Prefs.setPathData(pathId, 'prefs.', (ctx.request as unknown as RequestWithBody).body)

  // respond with updated prefs
  const prefs = await Prefs.get() as unknown as PrefsType
  ctx.body = prefs

  // (re)start watcher?
  if ('isWatchingEnabled' in (ctx.request as unknown as RequestWithBody).body) {
    process.emit(PREFS_PATHS_CHANGED, prefs.paths)
  }

  // need to push updated queue items?
  if ('isVideoKeyingEnabled' in (ctx.request as unknown as RequestWithBody).body) {
    for (const { room, roomId } of Rooms.getActive(ctx.io)) {
      ctx.io.to(room).emit('action', {
        type: QUEUE_PUSH,
        payload: await Queue.get(roomId),
      })
    }
  }
})

// remove a media path
router.delete('/path/:pathId', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const pathId = parseInt(ctx.params.pathId, 10)

  if (isNaN(pathId)) {
    ctx.throw(422, 'Invalid pathId')
  }

  ctx.stopScanner()

  await Prefs.removePath(pathId)

  // respond with updated prefs
  const prefs = await Prefs.get() as unknown as PrefsType
  ctx.body = prefs

  // (re)start watcher
  process.emit(PREFS_PATHS_CHANGED, prefs.paths)

  await Media.cleanup()

  // no need to await
  pushQueuesAndLibrary(ctx.io)
})

// scan a media path
router.get('/path/:pathId/scan', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const pathId = parseInt(ctx.params.pathId, 10)

  if (isNaN(pathId)) {
    ctx.throw(422, 'Invalid pathId')
  }

  ctx.status = 200
  ctx.startScanner(pathId)
})

// scan all media paths
router.get('/paths/scan', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  ctx.status = 200
  ctx.startScanner(true)
})

// stop scanning
router.get('/paths/scan/stop', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  ctx.status = 200
  ctx.stopScanner()
})

// get folder listing for path browser
router.get('/path/ls', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const dir = decodeURIComponent(ctx.query.dir as string)

  // windows is a special snowflake and gets an
  // extra top level of available drive letters
  if (dir === '' && process.platform === 'win32') {
    const drives = getWindowsDrives()

    ctx.body = {
      current: '',
      parent: false,
      children: drives,
    }
  } else {
    const current = path.resolve(dir)
    const parent = path.resolve(dir, '../')

    const list = await getFolders(dir)
    log.verbose('%s listed path: %s', ctx.user.name, current)

    ctx.body = {
      current,
      // if at root, windows gets a special top level
      parent: parent === current ? (process.platform === 'win32' ? '' : false) : parent,
      children: list.map(p => ({
        path: p,
        label: p.replace(current + path.sep, ''),
      })).filter(c => !(c.label.startsWith('.') || c.label.startsWith('/.'))),
    }
  }
})

export default router
