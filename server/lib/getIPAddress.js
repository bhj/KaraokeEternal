// https://gist.github.com/savokiss/96de34d4ca2d37cbb8e0799798c4c2d3
module.exports = function () {
  const interfaces = require('os').networkInterfaces()

  for (const devName in interfaces) {
    const iface = interfaces[devName]

    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]

      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address
      }
    }
  }
}
