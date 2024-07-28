import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
const readdir = promisify(fs.readdir)

const getFolders = dir => readdir(dir, { withFileTypes: true })
  .then(list => Promise.all(list.map(ent => ent.isDirectory() ? path.resolve(dir, ent.name) : null)))
  .then(list => list.filter(f => !!f).sort())

export default getFolders
