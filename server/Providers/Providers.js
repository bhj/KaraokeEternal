const debug = require('debug')
const log = debug('app:Providers')
const getProviders = require('./getProviders')
const providerImports = require('./')
let providerQueue = []

class Providers {
  static async startScan (providerName) {
    log(`Media scan requested (provider=${providerName})`)

    // already in the queue?
    if (providerQueue.includes(providerName)) {
      log(`  => skipping (already in scanner queue)`)
      return
    } else {
      providerQueue.push(providerName)
      log(`  => added to scanner queue at position ${providerQueue.length}`)
    }

    if (this._isScanning) {
      // let the loop do its thing
      return
    }

    this._isScanning = true
    this._isCanceling = false

    while (providerQueue.length) {
      const name = providerQueue.shift()
      log(`Preparing to scan with provider '${name}'`)

      try {
        const providers = await this.getAll()
        const provider = providers.entities[name]

        // provider exists?
        if (typeof provider !== 'object') {
          log(`  => skipping (not found)`)
          continue
        }

        // provider enabled?
        if (!provider.isEnabled) {
          log(`  => skipping (not enabled)`)
          continue
        }

        // sanity check on provider scanner
        if (!providerImports[name] || !providerImports[name].Scanner) {
          log(`  => skipping (invalid scanner)`)
          continue
        }

        log(`  => starting scan`)
        this._scanner = new providerImports[name].Scanner(provider.prefs)
        await this._scanner.scan()
        log(`Finished scan with provider '${name}'`)
      } catch (err) {
        log(err)
      }

      if (this._isCanceling) {
        log('Media scan canceled by user')
        break
      }
    } // end while

    this._scanner.emitDone()
    this._scanner.emitLibrary()

    this._scanner = null
    this._isScanning = false
    this._isCanceling = false
    providerQueue = []
    log('Media scan complete')
  }

  static cancelScan () {
    if (this._scanner) {
      this._isCanceling = true
      this._scanner.cancel()
    }
  }

  static async getAll () {
    return getProviders()
  }
}

module.exports = Providers
