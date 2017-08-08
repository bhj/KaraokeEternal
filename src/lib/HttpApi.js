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

    return fetch(`${this.prefix}${url}`, opts)
      .then(response => {
        if (response.status >= 200 && response.status < 300) {
          return response
        } else {
          return response.text().then(txt => {
            return Promise.reject(new Error(txt))
          })
        }
      })
      .then(response => response.json())
  }
}
