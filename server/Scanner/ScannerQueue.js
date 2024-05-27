const FileScanner = require('./FileScanner')
const Prefs = require('../Prefs')
const log = require('../lib/Log')('queue')

class ScannerQueue {
  static #instance
  static #isCanceling = false
  static #q = []

  static async queue (pathIds) {
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
  }

  static async start (cb) {
    log.info('Starting media scan')

    while (this.#q.length && !this.#isCanceling) {
      const prefs = await Prefs.get()
      this.#instance = new FileScanner(prefs, { length: this.#q.length })

      await this.#instance.scan(this.#q.shift())
      await cb({ length: this.#q.length })
    }
  }

  static stop () {
    log.info('Stopping media scan (user requested)')
    this.#isCanceling = true

    if (this.#instance) {
      this.#instance.cancel()
    }
  }
}

module.exports = ScannerQueue
