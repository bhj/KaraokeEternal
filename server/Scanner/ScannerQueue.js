const FileScanner = require('./FileScanner')
const Prefs = require('../Prefs')
const log = require('../lib/Log')('queue')

class ScannerQueue {
  #instance
  #isCanceling = false
  #q = []

  constructor (onIteration, onDone) {
    this.onIteration = onIteration
    this.onDone = onDone
  }

  async queue (pathIds) {
    const prefs = await Prefs.get()

    if (pathIds === true) {
      pathIds = prefs.paths.result // queueing all paths
    } else if (Number.isInteger(pathIds)) {
      pathIds = [pathIds]
    }

    if (!Array.isArray(pathIds)) {
      log.warn('invalid pathIds: %s', pathIds)
      return
    }

    pathIds.forEach(id => {
      const dir = prefs.paths.entities[id]?.path

      if (!dir) {
        log.warn('ignoring (invalid pathId): %s', id)
      } else if (this.#q.includes(id)) {
        log.info('ignoring (path already queued): %s', dir)
      } else {
        log.info('path queued for scan: %s', dir)
        this.#q.push(id)
      }
    })

    if (this.#q.length && !this.#instance) {
      this.start()
    }
  }

  async start () {
    log.info('Starting media scan')

    while (this.#q.length && !this.#isCanceling) {
      const prefs = await Prefs.get()
      this.#instance = new FileScanner(prefs, { length: this.#q.length })

      const stats = await this.#instance.scan(this.#q.shift())
      this.onIteration(stats)
    }

    this.onDone()
  }

  stop () {
    log.info('Stopping media scan (user requested)')
    this.#isCanceling = true

    if (this.#instance) {
      this.#instance.cancel()
    }
  }
}

module.exports = ScannerQueue
