import { promisify } from 'util'
import fs from 'fs'
import getPerms from './getPermutations.js'
const stat = promisify(fs.stat)

export default async function getCdgName (file) {
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
