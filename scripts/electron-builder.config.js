/* eslint-disable max-len, no-template-curly-in-string */
const project = require('../project.config')
const path = require('path')
const getUnused = require('./getUnused')
const config = {
  appId: 'com.karaoke-forever.app',
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
    '!**/node_modules/node-pre-gyp${/*}',
    '!**/node_modules/sqlite3/lib/binding/node-${/*}',
    '!**/node_modules/sqlite3/build',
    '!**/node_modules/sqlite3/deps',
    '!**/node_modules/sqlite3/tools',
  ],
  'mac': {
    'target': 'dmg',
    'icon': 'assets/app.png',
  },
  'win': {
    'target': 'nsis',
    'icon': 'assets/app.ico',
  },
  'nsis': {
    'oneClick': false,
  },
}

module.exports = async function () {
  const unused = await getUnused(path.join(project.basePath, 'server'))

  unused.forEach(m => {
    config.files.push(
      '!**' + path.sep + path.join('node_modules', m) + '${/*}'
    )
    console.log('[unused]', m)
  })

  console.log(unused.length, 'unused modules found')
  return config
}
