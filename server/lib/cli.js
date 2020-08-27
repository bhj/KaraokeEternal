const env = {
  NODE_ENV: process.env.NODE_ENV,
}

const options = {
  scannerConsoleLevel: 'KF_SCANNER_CONSOLE_LEVEL',
  scannerLogLevel: 'KF_SCANNER_LOG_LEVEL',
  serverConsoleLevel: 'KF_SERVER_CONSOLE_LEVEL',
  serverLogLevel: 'KF_SERVER_LOG_LEVEL',
  port: 'KF_SERVER_PORT',
}

const yargs = require('yargs')
  .version(false) // disable default handler
  .command('scanonly', 'Run a media scan on server startup, then exit when finished')
  .option('p', {
    alias: 'port',
    describe: 'Web server port (default=auto)',
    number: true,
    requiresArg: true,
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

if (argv._.includes('scanonly')) {
  env.KF_SERVER_SCAN_ONLY = true
}

// settings via CLI take precendence over env vars
Object.keys(options).forEach(key => {
  if (typeof argv[key] !== 'undefined') {
    env[options[key]] = argv[key]
    process.env[options[key]] = argv[key]
  } else if (process.env[options[key]]) {
    env[options[key]] = process.env[options[key]]
  }
})

module.exports = env
