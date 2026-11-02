import PathScanner from './PathScanner/PathScanner.js'
import type { ScanStats } from './Scanner.js'
import Prefs from '../Prefs/Prefs.js'
import getLogger from '../lib/Log.js'

const log = getLogger('queue')

class PathScannerQueue {
  #instance: PathScanner | undefined
  #isCanceling = false
  #q: { pathId: number, full: boolean }[] = []
  onIteration: (stats: ScanStats) => void
  onDone: () => void

  constructor (onIteration: (stats: ScanStats) => void, onDone: () => void) {
    this.onIteration = onIteration
    this.onDone = onDone
  }

  queue (pathIds: number | number[] | true, full = false): void {
    const prefs = Prefs.get()

    if (pathIds === true) {
      pathIds = prefs.paths.result
    } else if (Number.isInteger(pathIds)) {
      pathIds = [pathIds as number]
    }

    if (!Array.isArray(pathIds)) {
      log.warn('invalid pathIds: %s', pathIds)
      return
    }

    pathIds.forEach((id) => {
      const dir = prefs.paths.entities[id]?.path
      const queued = this.#q.find(item => item.pathId === id)

      if (!dir) {
        log.warn('ignoring (invalid pathId): %s', id)
      } else if (queued) {
        queued.full = queued.full || full
        log.info('ignoring (path already queued): %s', dir)
      } else {
        log.info('path queued for scan: %s', dir)
        this.#q.push({ pathId: id, full })
      }
    })

    if (this.#q.length && !this.#instance) {
      this.start()
    }
  }

  async start (): Promise<void> {
    log.info('Starting media scan')

    while (this.#q.length && !this.#isCanceling) {
      const prefs = Prefs.get()
      this.#instance = new PathScanner(prefs, { length: this.#q.length })

      const { pathId, full } = this.#q.shift()
      const stats = await this.#instance.scan(pathId, full)
      this.onIteration(stats)
    }

    this.onDone()
  }

  stop (): void {
    log.info('Stopping media scan (user requested)')
    this.#isCanceling = true

    if (this.#instance) this.#instance.cancel()
  }
}

export default PathScannerQueue
