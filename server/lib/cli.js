const program = require('commander')
const appVer = process.versions['electron'] && process.env.NODE_ENV !== 'development'
  ? require('electron').app.getVersion() : process.env.npm_package_version

// fix for https://github.com/electron/electron/issues/4690
if (process.defaultApp !== true) {
  process.argv.unshift(null)
}

// prep environment variables to pass to child processes based on the
// CLI options and env vars set for the current process. An option
// passed by CLI will override the equivalent environment variable.
function computeEnv () {
  const env = { NODE_ENV: process.env.NODE_ENV }

  // parse cli args
  program
    .version(appVer)
    .usage('[options]')
    .option('-p --port <number>', 'Server port')
    .option('-l --log-level <number>', 'Log file level (0=off, 1=error, 2=warn, 3=info, 4=verbose, 5=debug)')
    .parse(process.argv)

  // KF_SERVER_PORT
  if (program.port) {
    if (!Number.parseInt(program.port, 10)) {
      console.error('Error: invalid server port: ' + program.port)
      process.exit()
    }

    env.KF_SERVER_PORT = program.port
  } else if (process.env.KF_SERVER_PORT) {
    env.KF_SERVER_PORT = process.env.KF_SERVER_PORT
  }

  // KF_LOG_LEVEL
  if (program.logLevel) {
    const int = Number.parseInt(program.logLevel, 10)

    if (typeof int !== 'number' || int < 0 || int > 5) {
      console.error('Error: invalid log level: ' + program.logLevel)
      process.exit()
    }

    env.KF_LOG_LEVEL = program.logLevel
  } else if (process.env.KF_LOG_LEVEL) {
    env.KF_LOG_LEVEL = process.env.KF_LOG_LEVEL
  }

  return env
}

module.exports = computeEnv
