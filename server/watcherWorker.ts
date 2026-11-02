import fs from 'fs'
import pathLib from 'path'
import { initLogger } from './lib/Log.js'
import accumulatedThrottle from './lib/accumulatedThrottle.js'
import fileTypes from './Media/fileTypes.js'
import { CONFIG_FILENAME } from './Scanner/scanUtils.js'
import {
  WATCHER_WORKER_EVENT,
  WATCHER_WORKER_WATCH,
} from '../shared/actionTypes.js'

const env = JSON.parse(process.env.KES_ENV_JSON)
const log = initLogger('scanner', {
  console: {
    level: env.KES_SCANNER_CONSOLE_LEVEL ?? (env.NODE_ENV === 'development' ? 5 : 4),
    useStyles: env.KES_CONSOLE_COLORS ?? undefined,
  },
  file: {
    level: env.KES_SCANNER_LOG_LEVEL ?? (env.NODE_ENV === 'development' ? 0 : 3),
  },
}).scope(`watcher[${process.pid}]`)

const refs = []
const searchExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].scan !== false)

;(async function () {
  const { default: IPC } = await import('./lib/IPCBridge.js')

  IPC.use({
    [WATCHER_WORKER_WATCH]: ({ payload }) => {
      while (refs.length) {
        const ref = refs.shift()
        ref.close()
      }

      const { result, entities } = payload.paths
      const pathIds = result.filter(pathId => entities[pathId]?.prefs?.isWatchingEnabled)

      if (!pathIds.length) {
        log.info('no paths with watching enabled; exiting')
        process.exit(0) // eslint-disable-line n/no-process-exit
      }

      log.info('watching %s path(s):', pathIds.length)

      pathIds.forEach((pathId) => {
        log.info('  => %s', entities[pathId].path)

        const cb = accumulatedThrottle((events) => {
          const matched = events.filter(([, filename]) => searchExts.includes(pathLib.extname(filename).toLowerCase())
            || pathLib.basename(filename).toLowerCase() === CONFIG_FILENAME)
          if (!matched.length) return

          log.info('event in path: %s (filename=%s) (type=%s)', entities[pathId].path, matched[0][1], matched[0][0])

          const files = [...new Set(matched.map(([, filename]) => pathLib.join(entities[pathId].path, filename)))]

          IPC.send({
            type: WATCHER_WORKER_EVENT,
            payload: { pathId, files },
          })
        }, 1000)

        const ref = fs.watch(entities[pathId].path, { recursive: true }, cb)
        refs.push(ref)
      })
    },
  })
})()
