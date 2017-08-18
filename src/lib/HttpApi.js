export default class HttpApi {
  constructor (prefix) {
    this.prefix = prefix
    this.opts = {
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      })
    }

    // do fetch()
    return this.callApi
  }

  callApi = (method, url, opts = {}) => {
    opts = Object.assign({}, this.opts, opts)
    opts.method = method

    if (typeof opts.body === 'object') {
      opts.body = JSON.stringify(opts.body)
    }

    return fetch(`${this.prefix}${url}`, opts)
      .then(res => {
        if (res.status >= 200 && res.status < 300) {
          // success
          if (res.headers.get('Content-Type').includes('application/json')) {
            return res.json()
          } else {
            return res
          }
        }

        // error
        return res.text().then(txt => {
          return Promise.reject(new Error(txt))
        })
      })
  }
}
