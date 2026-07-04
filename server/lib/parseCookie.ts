// cookie helper based on
// http://stackoverflow.com/questions/3393854/get-and-set-a-single-cookie-with-node-js-http-server
export default function parseCookie (cookie) {
  const list: Record<string, string> = {}

  if (cookie) {
    cookie.split(';')
      .forEach((c) => {
        const parts = c.split('=')
        const name = parts.shift().trim()
        const raw = parts.join('=')

        try {
          list[name] = decodeURI(raw)
        } catch {
          list[name] = raw
        }
      })
  }

  return list
}
