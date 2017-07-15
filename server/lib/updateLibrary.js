const path = require('path')
const debug = require('debug')
const log = debug('app:library')

const Providers = require('../providers')
const getLibrary = require('./getLibrary')
const getPrefs = require('./getPrefs')
const getFiles = require('./async/getFiles')
const getSongAdder = require('./songAdder')
const throttle = require('./async/throttle')

const {
  LIBRARY_UPDATE,
  LIBRARY_UPDATE_STATUS,
} = require('../constants')

let isScanning, isCanceling
let validIds = [] // songIds for cleanup

async function updateLibrary (ctx, { provider }) {
  // curried with ctx and throttled
  const emitStatus = getStatusEmitter(ctx)
  const emitLibrary = getLibraryEmitter(ctx)

  // curried with library emitter and passed to each provider
  const addSong = getSongAdder(emitLibrary)

  const localProviders = {} // map of file extensions to provider
  const onlineProviders = []
  let prefs

  if (isScanning) {
    return Promise.reject(new Error(`Library update already in progress`))
  }

  isScanning = true
  log('Library update requested')

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
      if (!Array.isArray(prefs.app.paths) || !prefs.app.paths.length) {
        log(`  => skipping provider "${name}" (no media paths configured)`)
        continue
      }

      log(`  => using provider "${name}" (local; supported types: ${Providers[name].extensions.join(',')})`)

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

    // emit start
    emitStatus('Searching media folders', 0)

    for (const p of prefs.app.paths) {
      let list

      if (isCanceling) {
        log('Canceling library update (user requested)')
        emitStatus(null, null, true)
        isCanceling = false
        isScanning = false
        return
      }

      try {
        log('Searching path: %s', p)
        list = await getFiles(p, file => allowedExts.includes(path.extname(file).toLowerCase()))
      } catch (err) {
        // try next configured path
        log(err.message)
        continue
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

      if (isCanceling) {
        log('Canceling library update (user requested)')
        emitStatus(null, null, true)
        isCanceling = false
        isScanning = false
        return
      }
    } // end for
  } // end if

  // any enabled online providers?
  if (onlineProviders.length) {
    for (const name of onlineProviders) {
      // @todo ...
    }
  }

  // emit completion
  emitStatus(null, null, true)

  // // delete songs not in our valid list
  // let res = await db.run('DELETE FROM songs WHERE provider = ? AND songId NOT IN ('+validIds.join(',')+')', payload)
  // log('cleanup: removed %s invalid songs', res.stmt.changes)
  //
  isScanning = false
  log('finished scan')
  return Promise.resolve()
}

function cancelUpdate () {
  isCanceling = true
}

module.exports = { updateLibrary, cancelUpdate }

function getStatusEmitter (ctx) {
  return throttle(function (text, progress, complete = false) {
    // thunkify
    return Promise.resolve().then(() => {
      ctx.sock.server.emit('action', {
        type: LIBRARY_UPDATE_STATUS,
        payload: { text, progress, complete },
      })
    })
  }, 500)
}

function getLibraryEmitter (ctx) {
  return throttle(async function () {
    ctx.sock.server.emit('action', {
      type: LIBRARY_UPDATE,
      payload: await getLibrary(),
    })
  }, 2000)
}
