const debug = require('debug')
const log = debug('app:Providers')
const getProviders = require('./getProviders')
const providerImports = require('./')

class Providers {
  static async startScan (ctx) {
    let providers
    this._isScanning = true
    log(`Media scan requested (provider=${ctx.query.provider})`)

    try {
      providers = await this.getAll()
    } catch (err) {
      return Promise.reject(err)
    }

    // was a particular provider requested?
    if (ctx.query.provider) {
      providers.result = providers.result.filter(name => name === ctx.query.provider)
    }

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
        this._scanner = new providerImports[name].Scanner(ctx, providerCfg.prefs)
        await this._scanner.run()
      } catch (err) {
        log(`  => ${err}`)
      }
    } // end for

    this._scanner = null
    this._isScanning = false
    log('Media scan complete')
  }

  static cancelScan () {
    if (this._scanner) {
      this._scanner.stop()
    }
  }

  static isScanning () {
    return this._isScanning
  }

  static async getAll () {
    return getProviders()
  }
}

module.exports = Providers
