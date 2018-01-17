const debug = require('debug')
const log = debug('app:Providers')
const getProviders = require('./getProviders')
const providerImports = require('./')

class Providers {
  static async startScan (providerName) {
    let providers

    if (this._isScanning) {
      log('Ignoring media scan request (already in progress)')
      return
    }

    log(`Media scan requested (provider=${providerName})`)

    try {
      providers = await this.getAll()
    } catch (err) {
      return Promise.reject(err)
    }

    // was a particular provider requested?
    if (providerName) {
      providers.result = providers.result.filter(name => name === providerName)
    }

    if (!providers.result.length) {
      log(`  => skipping scan: no matching providers found`)
      return
    }

    this._isScanning = true
    this._isCanceling = false

    for (const name of providers.result) {
      const providerCfg = providers.entities[name]

      // is provider enabled?
      if (!providerCfg || !providerCfg.isEnabled) {
        log(`  => skipping provider: ${name} (not enabled)`)
        continue
      }

      // sanity check on provider scanner
      if (!providerImports[name] || !providerImports[name].Scanner) {
        log(`  => skipping provider: ${name} (invalid scanner)`)
        continue
      }

      log(`  => scanning media with provider: ${name}`)

      try {
        this._scanner = new providerImports[name].Scanner(providerCfg.prefs)
        await this._scanner.scan()
      } catch (err) {
        log(err)
      }

      if (this._isCanceling) {
        log('Scan canceled by user')
        break
      }
    } // end for

    this._scanner.emitDone()
    this._scanner.emitLibrary()

    this._scanner = null
    this._isScanning = false
    this._isCanceling = false
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
