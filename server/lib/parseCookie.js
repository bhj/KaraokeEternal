// cookie helper based on
// http://stackoverflow.com/questions/3393854/get-and-set-a-single-cookie-with-node-js-http-server
module.exports = function parseCookie (cookie) {
  const list = {}

  cookie && cookie.split(';').forEach(c => {
    const parts = c.split('=')
    list[parts.shift().trim()] = decodeURI(parts.join('='))
  })

  return list
}
