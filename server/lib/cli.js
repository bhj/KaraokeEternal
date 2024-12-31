import os from 'os'
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
const baseDir = path.resolve(import.meta.dirname, '..', '..')

const env = {
  NODE_ENV: process.env.NODE_ENV,
  KES_CONSOLE_COLORS: process.env.KES_CONSOLE_COLORS
    ? !['0', 'false'].includes(process.env.KES_CONSOLE_COLORS?.toLowerCase())
    : undefined,
  KES_PATH_ASSETS: path.join(baseDir, 'assets'),
  KES_PATH_DATA: process.env.KES_PATH_DATA || getAppPath('Karaoke Eternal Server'),
  KES_PATH_WEBROOT: path.join(baseDir, 'build'),
  KES_PORT: parseInt(process.env.KES_PORT, 10) || 0,
  KES_ROTATE_KEY: ['1', 'true'].includes(process.env.KES_ROTATE_KEY?.toLowerCase()),
  KES_SCAN: process.env.KES_SCAN?.trim(),
  KES_SCANNER_CONSOLE_LEVEL: parseInt(process.env.KES_SCANNER_CONSOLE_LEVEL, 10) || undefined,
  KES_SCANNER_LOG_LEVEL: parseInt(process.env.KES_SCANNER_LOG_LEVEL, 10) || undefined,
  KES_SERVER_CONSOLE_LEVEL: parseInt(process.env.KES_SERVER_CONSOLE_LEVEL, 10) || undefined,
  KES_SERVER_LOG_LEVEL: parseInt(process.env.KES_SERVER_LOG_LEVEL, 10) || undefined,
  KES_URL_PATH: process.env.KES_URL_PATH || '/',
  // support PUID/PGID convention
  KES_PUID: parseInt(process.env.PUID, 10) || undefined,
  KES_PGID: parseInt(process.env.PGID, 10) || undefined,
}

const argv = yargs(hideBin(process.argv))
  .version(false) // disable default handler
  .option('data', {
    describe: 'Absolute path of folder for database files',
    requiresArg: true,
    type: 'string',
  })
  .option('p', {
    alias: 'port',
    describe: 'Web server port (default=0/auto)',
    number: true,
    requiresArg: true,
  })
  .option('rotateKey', {
    describe: 'Rotate the session key at startup',
  })
  .option('scan', {
    describe: 'Run the media scanner at startup. Accepts a comma-separated list of pathIds, or "all"',
    type: 'string',
  })
  .option('scannerConsoleLevel', {
    describe: 'Media scanner console output level (default=4)',
    number: true,
    requiresArg: true,
  })
  .option('scannerLogLevel', {
    describe: 'Media scanner log file level (default=3)',
    number: true,
    requiresArg: true,
  })
  .option('serverConsoleLevel', {
    describe: 'Web server console output level (default=4)',
    number: true,
    requiresArg: true,
  })
  .option('serverLogLevel', {
    describe: 'Web server log file level (default=3)',
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
  .parse()

if (argv.version) {
  console.log(process.env.npm_package_version)
  process.exit(0) // eslint-disable-line n/no-process-exit
}

if (argv.rotateKey) {
  env.KES_ROTATE_KEY = true
}

// CLI options take precedence over env vars
const opts = {
  data: 'KES_PATH_DATA',
  port: 'KES_PORT',
  scan: 'KES_SCAN',
  scannerConsoleLevel: 'KES_SCANNER_CONSOLE_LEVEL',
  scannerLogLevel: 'KES_SCANNER_LOG_LEVEL',
  serverConsoleLevel: 'KES_SERVER_CONSOLE_LEVEL',
  serverLogLevel: 'KES_SERVER_LOG_LEVEL',
  urlPath: 'KES_URL_PATH',
}

for (const opt in opts) {
  if (typeof argv[opt] !== 'undefined') {
    env[opts[opt]] = argv[opt]
    process.env[opts[opt]] = argv[opt]
  }
}

export default env

function getAppPath (appName) {
  const home = os.homedir ? os.homedir() : process.env.HOME

  switch (process.platform) {
    case 'darwin': {
      return path.join(home, 'Library', 'Application Support', appName)
    }

    case 'win32': {
      return process.env.APPDATA || path.join(home, 'AppData', 'Roaming', appName)
    }

    default: {
      return process.env.XDG_CONFIG_HOME || path.join(home, '.config', appName)
    }
  }
}
