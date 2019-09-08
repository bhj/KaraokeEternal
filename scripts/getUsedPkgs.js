const util = require('util')
const madge = require('madge')
const resolve = require('resolve-tree')
const resolvePackages = util.promisify(resolve.packages)

/**
 * Get the node_modules require()d by source files in the given directory
 * @param  {String} dir starting search path
 * @return {Array} package names
 */
module.exports = async function (dir) {
  const deps = await getRequires(dir)
  const childDeps = await resolveDeps(deps)

  return [...deps, ...childDeps]
}

/**
 * Get names of all npm packages require()d by files in a directory
 * @param  {String} dir starting search path
 * @return {Array}      package names
 */
async function getRequires (dir) {
  const names = new Set() // prevent dupes

  return madge(dir, { includeNpm: true })
    .then(res => res.obj())
    .then(files => {
      Object.keys(files).forEach(file => {
        files[file].forEach(f => {
          const name = getPackageName(f)
          if (name) names.add(name)
        })
      })

      return Array.from(names)
    })
}

/**
 * Get names of all child dependencies of the given npm package names
 * @param  {Array} packageNames package names
 * @return {Array} package names
 */
async function resolveDeps (packageNames = []) {
  const tree = await resolvePackages(packageNames)
  const names = resolve.flattenMap(tree, 'name')
  return Array.from(new Set(names))
}

/**
 * Convert require() string to npm package name (handles namespaces)
 * @param  {String} str
 * @return {String} package name
 */
function getPackageName (str) {
  const parts = str.split('/')
  const i = parts.indexOf('node_modules')
  if (i === -1) return false

  const ns = parts[i + 1].startsWith('@')
  return parts[i + 1] + (ns ? '/' + parts[i + 2] : '')
}
