const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const getPerms = require('./getPermutations')

module.exports = async function getCdgName (file) {
  // upper and lowercase permutations since fs may be case-sensitive
  for (const ext of getPerms('cdg')) {
    const cdg = file.substring(0, file.lastIndexOf('.') + 1) + ext

    try {
      await stat(cdg)
      return cdg
    } catch (err) {
      // try another permutation
    }
  } // end for

  return false
}
