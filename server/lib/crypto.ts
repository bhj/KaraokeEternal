import getLogger from './Log.js'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

const log = getLogger('crypto')

const ARGON2_CONFIG = {
  parallelism: 1,
  tagLength: 32,
  memory: 65536,
  passes: 3,
}

function hash (password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, nonce) => {
      if (err) {
        log.error(err)
        return reject(err)
      }

      crypto.argon2('argon2id', {
        message: password,
        nonce,
        ...ARGON2_CONFIG,
      }, (err, derivedKey) => {
        if (err) {
          log.error(err)
          return reject(err)
        }

        const saltB64 = nonce.toString('base64').replace(/=/g, '')
        const hashB64 = derivedKey.toString('base64').replace(/=/g, '')
        const str = `$argon2id$v=19$m=${ARGON2_CONFIG.memory},t=${ARGON2_CONFIG.passes},p=${ARGON2_CONFIG.parallelism}$${saltB64}$${hashB64}`

        resolve(str)
      })
    })
  })
}

function compare (password: string, hashStr: string): Promise<boolean> {
  if (!hashStr) return Promise.resolve(false)

  // legacy bcrypt verify
  if (hashStr.startsWith('$2')) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hashStr, function (err, matched) {
        if (err) {
          log.error(err)
          return reject(err)
        }
        return resolve(matched)
      })
    })
  }

  // Argon2 verify
  return new Promise((resolve, reject) => {
    try {
      const parts = hashStr.split('$')
      if (parts.length !== 6 || parts[1] !== 'argon2id' || parts[2] !== 'v=19') {
        return resolve(false)
      }

      const params = new URLSearchParams(parts[3].replace(/,/g, '&'))
      const m = parseInt(params.get('m') || '', 10)
      const t = parseInt(params.get('t') || '', 10)
      const p = parseInt(params.get('p') || '', 10)

      const nonce = Buffer.from(parts[4], 'base64')
      const expectedHash = Buffer.from(parts[5], 'base64')

      if (isNaN(m) || isNaN(t) || isNaN(p) || !nonce.length || !expectedHash.length) {
        return resolve(false)
      }

      crypto.argon2('argon2id', {
        message: password,
        nonce,
        parallelism: p,
        tagLength: expectedHash.length,
        memory: m,
        passes: t,
      }, (err, derivedKey) => {
        if (err) {
          log.error(err)
          return reject(err)
        }

        try {
          if (derivedKey.length !== expectedHash.length) {
            return resolve(false)
          }

          const match = crypto.timingSafeEqual(derivedKey, expectedHash)
          resolve(match)
        } catch (e) {
          log.error(e)
          resolve(false)
        }
      })
    } catch (e) {
      log.error(e)
      resolve(false)
    }
  })
}

function isLegacy (hashStr: string) {
  return typeof hashStr === 'string' && hashStr.startsWith('$2')
}

export default {
  hash,
  compare,
  isLegacy,
}
