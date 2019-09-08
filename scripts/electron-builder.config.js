/* eslint-disable max-len, no-template-curly-in-string */
const project = require('../project.config')
const path = require('path')
const getAllPkgs = require('./getAllPkgs')
const getUsedPkgs = require('./getUsedPkgs')
const config = {
  appId: 'com.karaoke-forever.app',
  productName: 'Karaoke Forever Server',
  files: [
    'assets/**',
    'build/**',
    'shared/**',
    'server/**',
    'project.config.js',
    '!**/node_modules/**/{CONTRIBUTORS,CNAME,AUTHOR,TODO,CONTRIBUTING,COPYING,INSTALL,NEWS,PORTING,Dockerfile,Makefile,htdocs,CHANGELOG,ChangeLog,changelog,README,Readme,readme,test,sample,example,demo,composer.json,tsconfig.json,jsdoc.json,tslint.json,typings.json,gulpfile,bower.json,package-lock,Gruntfile,CMakeLists,karma.conf,yarn.lock}*',
    '!**/node_modules/**/{man,benchmark,node_modules,spec,cmake,browser,vagrant,doxy*,bin,obj,obj.target,example,examples,test,tests,doc,docs,msvc,Xcode,CVS,RCS,SCCS}{,/**/*}',
    '!**/node_modules/**/*.{conf,png,pc,coffee,txt,spec.js,ts,js.flow,html,def,jst,xml,ico,in,ac,sln,dsp,dsw,cmd,vcproj,vcxproj,vcxproj.filters,pdb,exp,obj,lib,map,md,sh,gypi,gyp,h,cpp,yml,log,tlog,mk,c,cc,rc,xcodeproj,xcconfig,d.ts,yaml,hpp}',
    '!**/node_modules/ajv/dist${/*}',
    '!**/node_modules/bcrypt/build${/*}',
    '!**/node_modules/bcrypt/examples${/*}',
    '!**/node_modules/bcrypt/test${/*}',
    '!**/node_modules/sqlite3/lib/binding/node-*${/*}',
    '!**/node_modules/sqlite3/build',
    '!**/node_modules/sqlite3/deps',
    '!**/node_modules/sqlite3/tools',
  ],
  mac: {
    target: 'dir',
    icon: 'assets/app.png',
  },
  win: {
    target: 'nsis',
    icon: 'assets/app.ico',
  },
  nsis: {
    oneClick: false,
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
