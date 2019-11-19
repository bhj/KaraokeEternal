/* eslint-disable max-len, no-template-curly-in-string */
const manifest = require('../package.json')
const project = require('../project.config')
const path = require('path')
const getAllPkgs = require('./getAllPkgs')
const getUsedPkgs = require('./getUsedPkgs')
const config = {
  appId: 'com.RadRootLLC.KaraokeForeverServer',
  files: manifest.files,
  mac: {
    target: 'dmg',
    icon: 'assets/app.png',
  },
  win: {
    target: 'nsis',
    icon: 'assets/app.ico',
  },
  nsis: {
    oneClick: false,
    runAfterFinish: false,
  },
}

module.exports = async function () {
  console.log('Finding packages not used by server-side code...')

  const used = await getUsedPkgs(path.join(project.basePath, 'server'))
  const all = getAllPkgs(path.join(project.basePath, 'node_modules'))
  const unused = []

  all.forEach((m, i) => {
    if (used.includes(m)) return

    // exclude from build
    unused.push(m)
    config.files.push(
      '!**' + path.sep + path.join('node_modules', m) + '${/*}'
    )
  })

  console.log('Excluding', unused.length, 'items in node_modules: ')
  console.log(unused.join(','))

  return config
}
