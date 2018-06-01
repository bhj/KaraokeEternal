const childProcess = require('child_process')
const command = 'wmic logicaldisk get caption'

module.exports = function () {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (err, stdout) => {
      if (err) {
        return reject(err)
      }

      const rows = stdout.split(/\r?\n/)
      resolve(rows)
    })
  })
}
