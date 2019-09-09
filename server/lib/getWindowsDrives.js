const childProcess = require('child_process')
const command = 'wmic logicaldisk get Caption, ProviderName'
// sample output:
//
// Caption  ProviderName
// C:
// D:
// E:       \\vboxsrv\Downloads
// F:       \\vboxsrv\Karaoke

module.exports = function () {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (err, stdout) => {
      if (err) {
        return reject(err)
      }

      // split to lines
      const rows = stdout.split(/\r?\n/)

      // first line is heading(s)
      rows.shift()

      resolve(rows.filter(r => !!r.trim()).map(r => ({
        path: r.trim().substring(0, 2) + '\\',
        label: r,
      })))
    })
  })
}
