const path = require('path')
const baseDir = path.resolve(path.dirname(require.main.filename), '..')
const env = {
  NODE_ENV: process.env.NODE_ENV,
  KES_CONSOLE_LEVEL: parseInt(process.env.KES_CONSOLE_LEVEL, 10),
  KES_LOG_LEVEL: parseInt(process.env.KES_LOG_LEVEL, 10),
  KES_PATH_ASSETS: path.join(baseDir, 'assets'),
  KES_PATH_DATA: process.env.KES_PATH_DATA || baseDir,
  KES_PATH_WEBROOT: path.join(baseDir, 'build'),
  KES_PORT: parseInt(process.env.KES_PORT, 10) || 0,
  KES_ROTATE_KEY: ['1', 'true'].includes(process.env.KES_ROTATE_KEY?.toLowerCase()),
  KES_SCAN: ['1', 'true'].includes(process.env.KES_SCAN?.toLowerCase()),
  KES_SCAN_CONSOLE_LEVEL: parseInt(process.env.KES_SCAN_CONSOLE_LEVEL, 10),
  KES_SCAN_LOG_LEVEL: parseInt(process.env.KES_SCAN_LOG_LEVEL, 10),
  KES_URL_PATH: process.env.KES_URL_PATH || '/',
  // support PUID/PGID convention
  KES_PUID: parseInt(process.env.PUID, 10),
  KES_PGID: parseInt(process.env.PGID, 10),
}

const yargs = require('yargs')
  .version(false) // disable default handler
  .option('data', {
    describe: 'Absolute path for database file(s)',
    requiresArg: true,
    type: 'string',
  })
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
  .option('serverConsoleLevel', {
    describe: 'Web server console log level (default=4)',
    number: true,
    requiresArg: true,
  })
  .option('serverLogLevel', {
    describe: 'Web server file log level (default=3)',
    number: true,
    requiresArg: true,
  })
  .option('urlPath', {
    describe: 'Web server URL base path (default=/)',
    requiresArg: true,
    type: 'string',
  })
  .option('v', {
    alias: 'version',
    describe: 'Output the Karaoke Eternal Server version and exit',
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

// CLI options take precendence over env vars
if (argv.scan) {
  env.KES_SCAN = true
}

if (argv.rotateKey) {
  env.KES_ROTATE_KEY = true
}

const opts = {
  data: 'KES_PATH_DATA',
  port: 'KES_PORT',
  scanConsoleLevel: 'KES_SCAN_CONSOLE_LEVEL',
  scanLogLevel: 'KES_SCAN_LOG_LEVEL',
  serverConsoleLevel: 'KES_CONSOLE_LEVEL',
  serverLogLevel: 'KES_LOG_LEVEL',
  urlPath: 'KES_URL_PATH',
}

for (const opt in opts) {
  if (typeof argv[opt] !== 'undefined') {
    env[opts[opt]] = argv[opt]
    process.env[opts[opt]] = argv[opt]
  }
}

module.exports = env
