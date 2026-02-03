import fs from 'fs'
import getPerms from './getPermutations.js'

export default function getCdgName (file) {
  // upper and lowercase permutations since fs may be case-sensitive
  for (const ext of getPerms('cdg')) {
    const cdg = file.substring(0, file.lastIndexOf('.') + 1) + ext

    try {
      fs.statSync(cdg)
      return cdg
    } catch {
      // try another permutation
    }
  } // end for

  return false
}
