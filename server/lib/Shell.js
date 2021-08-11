const { exec } = require('child_process')

class Shell {
  static sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Streams input to output and resolves only after stream has successfully ended.
   * Closes the output stream in success and error cases.
   * @param input {stream.Readable} Read from
   * @param output {stream.Writable} Write to
   * @return Promise Resolves only after the output stream is "end"ed or "finish"ed.
   */
  static promisifiedPipe (input, output) {
    let ended = false
    function end () {
      if (!ended) {
        ended = true
        output.close && output.close()
        input.close && input.close()
        return true
      }
    }

    return new Promise((resolve, reject) => {
      input.pipe(output)
      input.on('error', errorEnding)

      function niceEnding () {
        if (end()) resolve()
      }

      function errorEnding (error) {
        if (end()) reject(error)
      }

      output.on('finish', niceEnding)
      output.on('end', niceEnding)
      output.on('error', errorEnding)
    })
  }

  /**
   * Executes a shell command and return it as a Promise.
   * @param cmd {string}
   * @return {Promise<string>}
   */
  static promisifiedExec (cmd) {
    return new Promise((resolve, reject) => {
      const env = process.env

      // this is probably not necessary outside of development...
      if (process.env.NODE_ENV === 'development') {
        env.LC_ALL = 'C.UTF-8'
        env.LANG = 'C.UTF-8'
      }

      exec(cmd, { env:env }, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        }
        resolve(stdout)
      })
    })
  }
}

module.exports = Shell
