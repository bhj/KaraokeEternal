const path = require('path')
const baseDir = path.resolve(path.dirname(require.main.filename), '..')
const env = {
  NODE_ENV: process.env.NODE_ENV,
  KF_SERVER_PATH_DATA: process.env.KF_SERVER_PATH_DATA || baseDir,
  KF_SERVER_PATH_ASSETS: process.env.KF_SERVER_PATH_ASSETS || path.join(baseDir, 'assets'),
  KF_SERVER_PATH_WEBROOT: process.env.KF_SERVER_PATH_WEBROOT || path.join(baseDir, 'build'),
  KF_SERVER_PORT: parseInt(process.env.KF_SERVER_PORT, 10) || 0,
  KF_SERVER_URL_PATH: process.env.KF_SERVER_URL_PATH || '/',
}

const yargs = require('yargs')
  .version(false) // disable default handler
  .option('p', {
    alias: 'port',
    describe: 'Web server port (default=auto)',
    number: true,
    requiresArg: true,
  })
  .option('rotateKey', {
    describe: 'Rotate the session key at startup',
  })
  .option('scan', {
    describe: 'Run the media scanner at startup',
  })
  .option('urlPath', {
    describe: 'Web server URL base path (default=/)',
    requiresArg: true,
    type: 'string',
  })
  .option('consoleLevel', {
    describe: 'Web server console log level (default=4)',
    number: true,
    requiresArg: true,
  })
  .option('logLevel', {
    describe: 'Web server file log level (default=3)',
    number: true,
    requiresArg: true,
  })
  .option('scanConsoleLevel', {
    describe: 'Media scanner console log level (default=4)',
    number: true,
    requiresArg: true,
  })
  .option('scanLogLevel', {
    describe: 'Media scanner file log level (default=3)',
    number: true,
    requiresArg: true,
  })
  .option('v', {
    alias: 'version',
    describe: 'Output the Karaoke Forever Server version and exit',
  })
  .usage('$0')
  .usage('  Logging options use the following numeric levels:')
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

if (argv.rotateKey) {
  env.KF_SERVER_ROTATE_KEY = true
}

// settings via CLI take precendence over env vars
const opts = {
  port: 'KF_SERVER_PORT',
  urlPath: 'KF_SERVER_URL_PATH',
  scannerConsoleLevel: 'KF_SERVER_SCAN_CONSOLE_LEVEL',
  scannerLogLevel: 'KF_SERVER_SCAN_LOG_LEVEL',
  serverConsoleLevel: 'KF_SERVER_CONSOLE_LEVEL',
  serverLogLevel: 'KF_SERVER_LOG_LEVEL',
}

for (const opt in opts) {
  if (typeof argv[opt] !== 'undefined') {
    env[opts[opt]] = argv[opt]
    process.env[opts[opt]] = argv[opt]
  }
}

module.exports = env
