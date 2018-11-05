let appVer

if (process.versions['electron']) {
  const app = require('electron').app
  appVer = app.getVersion()

  // fix for https://github.com/electron/electron/issues/4690
  if (app.isPackaged) {
    process.argv.unshift(null)
  }
} else appVer = process.env.npm_package_version

const argv = require('yargs')
  .option('l', {
    alias: 'loglevel',
    describe: 'Log file level (0=off, 1=error, 2=warn, 3=info, 4=verbose, 5=debug) (default=2)',
    requiresArg: true,
  })
  .option('p', {
    alias: 'port',
    describe: 'Web server port (default=0/auto)',
    requiresArg: true,
  })
  .version(appVer)
  .argv

const options = {
  loglevel: 'KF_LOG_LEVEL',
  port: 'KF_SERVER_PORT',
}

// Sets environment variables for the current process based on CLI args.
// Returns an object of env vars ready to hand to child_process.fork()
function computeEnv () {
  const env = { NODE_ENV: process.env.NODE_ENV }

  // an option set via CLI takes precendence over the environment variable
  Object.keys(options).forEach(key => {
    if (typeof argv[key] !== 'undefined') {
      env[options[key]] = argv[key]
      process.env[options[key]] = argv[key]
    } else if (process.env[options[key]]) {
      env[options[key]] = process.env[options[key]]
    }
  })

  return env
}

module.exports = computeEnv
