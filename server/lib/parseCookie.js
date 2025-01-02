// cookie helper based on
// http://stackoverflow.com/questions/3393854/get-and-set-a-single-cookie-with-node-js-http-server
export default function parseCookie (cookie) {
  const list = {}

  if (cookie) {
    cookie.split(';')
      .forEach((c) => {
        const parts = c.split('=')
        list[parts.shift().trim()] = decodeURI(parts.join('='))
      })
  }

  return list
}
