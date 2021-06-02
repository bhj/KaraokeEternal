const path = require('path')
const baseDir = path.resolve(path.dirname(require.main.filename), '..')
const env = {
  NODE_ENV: process.env.NODE_ENV,
  KF_SERVER_PATH_DATA: baseDir,
  KF_SERVER_PATH_ASSETS: path.join(baseDir, 'assets'),
  KF_SERVER_PATH_WEBROOT: path.join(baseDir, 'build'),
  KF_SERVER_URL_PATH: '/',
}

const yargs = require('yargs')
  .version(false) // disable default handler
  .option('p', {
    alias: 'port',
    describe: 'Web server port (default=auto)',
    number: true,
    requiresArg: true,
  })
  .option('urlPath', {
    describe: 'Web server URL base path (default=/)',
    requiresArg: true,
    type: 'string',
  })
  .option('scan', {
    describe: 'Run the media scanner at startup',
  })
  .option('scannerConsoleLevel', {
    describe: 'Media scanner console level (default=4)',
    number: true,
    requiresArg: true,
  })
  .option('scannerLogLevel', {
    describe: 'Media scanner log file level (default=3)',
    number: true,
    requiresArg: true,
  })
  .option('serverConsoleLevel', {
    describe: 'Web server console level (default=4)',
    number: true,
    requiresArg: true,
  })
  .option('serverLogLevel', {
    describe: 'Web server log file level (default=3)',
    number: true,
    requiresArg: true,
  })
  .option('v', {
    alias: 'version',
    describe: 'Output the Karaoke Forever Server version and exit',
  })
  .usage('$0')
  .usage('  Some options use the following numeric levels:')
  .usage('  0=off, 1=error, 2=warn, 3=info, 4=verbose, 5=debug')

let argv = yargs.argv

let _app
if (process.versions.electron) {
  _app = require('electron').app

  // see https://github.com/yargs/yargs/blob/master/docs/api.md#argv
  if (_app.isPackaged) {
    argv = yargs.parse(process.argv.slice(1))
  }
}

if (argv.version) {
  console.log(_app ? _app.getVersion() : process.env.npm_package_version)
  process.exit(0)
}

if (argv.scan) {
  env.KF_SERVER_SCAN = true
}

// settings via CLI take precendence over env vars
const opts = {
  port: 'KF_SERVER_PORT',
  urlPath: 'KF_SERVER_URL_PATH',
  scannerConsoleLevel: 'KF_SCANNER_CONSOLE_LEVEL',
  scannerLogLevel: 'KF_SCANNER_LOG_LEVEL',
  serverConsoleLevel: 'KF_SERVER_CONSOLE_LEVEL',
  serverLogLevel: 'KF_SERVER_LOG_LEVEL',
}

Object.keys(opts).forEach(key => {
  if (typeof argv[key] !== 'undefined') {
    env[opts[key]] = argv[key]
    process.env[opts[key]] = argv[key]
  } else if (process.env[opts[key]]) {
    env[opts[key]] = process.env[opts[key]]
  }
})

module.exports = env
