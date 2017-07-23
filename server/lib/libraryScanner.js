const path = require('path')
const debug = require('debug')
const log = debug('app:library:scanner')
const squel = require('squel')
const db = require('sqlite')

const Providers = require('../providers')
const getLibrary = require('./getLibrary')
const getPaths = require('../lib/getPaths')
const getPrefs = require('./getPrefs')
const getFiles = require('./async/getFiles')
const getSongAdder = require('./songAdder')
const throttle = require('./async/throttle')

const {
  LIBRARY_UPDATE,
  LIBRARY_SCAN_STATUS,
  LIBRARY_SCAN_COMPLETE,
} = require('../constants')

let isScanning, cancelRequested

async function scan (ctx, { provider }) {
  // curried with ctx and throttled
  const emitStatus = getStatusEmitter(ctx)
  const emitDone = getDoneEmitter(ctx)
  const emitLibrary = getLibraryEmitter(ctx)

  // curried with library emitter and passed to each provider
  const addSong = getSongAdder(emitLibrary)

  const localProviders = {} // map of file extensions to provider
  const onlineProviders = []
  const validIds = [] // songIds for cleanup
  let prefs

  if (isScanning) {
    return Promise.reject(new Error(`Library update already in progress`))
  }

  isScanning = true
  log('Library scan requested')

  // get all prefs
  try {
    prefs = await getPrefs()
  } catch (err) {
    return Promise.reject(err)
  }

  // determine which providers will be used
  for (const name in Providers) {
    // was a particular provider requested?
    if (provider && provider !== name) {
      continue
    }

    // sanity check
    if (typeof Providers[name] !== 'object') {
      log(`  => skipping provider "${name}" (invalid)`)
      continue
    }

    // is provider enabled?
    if (!prefs.provider[name] || !prefs.provider[name].enabled) {
      log(`  => skipping provider "${name}" (not enabled)`)
      continue
    }

    // local vs. online
    if (Providers[name].isLocal) {
      log(`  => using file provider "${name}" (types: ${Providers[name].extensions.join(',')})`)

      // map file extensions to Provider
      for (const ext of Providers[name].extensions) {
        localProviders[ext] = Providers[name]
      }
    } else {
      log(`  => using provider "${name}" (online)`)
      onlineProviders.push(name)
    }
  }

  // any enabled local providers?
  if (Object.keys(localProviders).length) {
    const allowedExts = Object.keys(localProviders)
    let files = []
    let paths

    try {
      paths = await getPaths()
    } catch (err) {
      log(`  => ${err.message}`)
      // something's pretty screwed up; bail
      return emitDone()
    }

    // emit start
    emitStatus('Searching media folders', 0)

    for (const pathId of paths.result) {
      const curPath = paths.entities[pathId].path
      let list

      try {
        log('Searching path: %s', curPath)
        list = await getFiles(curPath, file => allowedExts.includes(path.extname(file).toLowerCase()))
      } catch (err) {
        log(`  => ${err.message}`)
        continue
      }

      if (cancelRequested) {
        log('Canceling library scan (user requested)')
        return emitDone()
      }

      log('  => found %s files with supported extensions', list.length)
      files = files.concat(list)
    }

    log('Processing %s total files', files.length)

    for (let i = 0; i < files.length; i++) {
      const ext = path.extname(files[i]).toLowerCase()
      const method = localProviders[ext].processor

      // emit progress
      emitStatus(`Scanning media files (${i + 1} of ${files.length})`, ((i + 1) / files.length) * 100)
      log('[%s/%s] %s', i + 1, files.length, files[i])

      try {
        const songId = await method(addSong, files[i])

        // successfuly processed
        validIds.push(songId)
      } catch (err) {
        // just try the next file...
        log(err.message)
      }

      if (cancelRequested) {
        log('Canceling library scan (user requested)')
        return emitDone()
      }
    } // end for

    // cleanup: delete songs not in our valid list
    // try {
    //   const q = squel.delete()
    //     .from('songs')
    //     .where('provider IN ?', Object.keys(localProviders))
    //     .where('songId NOT IN ?', validIds)
    //     .where(`json_extract(providerData, '$.basePath') IN ?`, prefs.app.paths)
    //
    //   console.log(q.toString())
    //
    //   const { text, values } = q.toParam()
    //   const res = await db.run(text, values)
    //
    //   log('cleanup: removed %s songs', res.stmt.changes)
    // } catch (err) {
    //   log(err.message)
    // }
  } // end if

  // any enabled online providers?
  if (onlineProviders.length) {
    for (const name of onlineProviders) {
      // @todo ...
    }
  }

  return emitDone()
}

function cancelScan () {
  cancelRequested = true
}

module.exports = { scan, cancelScan }

function getStatusEmitter (ctx) {
  return throttle(function (text, progress) {
    // thunkify
    return Promise.resolve().then(() => {
      ctx._io.emit('action', {
        type: LIBRARY_SCAN_STATUS,
        payload: { text, progress },
      })
    })
  }, 500)
}

function getLibraryEmitter (ctx) {
  return throttle(async function () {
    ctx._io.emit('action', {
      type: LIBRARY_UPDATE,
      payload: await getLibrary(),
    })
  }, 2000)
}

function getDoneEmitter (ctx) {
  return async function () {
    ctx._io.emit('action', {
      type: LIBRARY_SCAN_COMPLETE,
      payload: null,
    })

    cancelRequested = false
    isScanning = false
  }
}
