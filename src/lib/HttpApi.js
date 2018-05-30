export default class HttpApi {
  constructor (prefix = '') {
    this.prefix = prefix
    this.opts = {
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      })
    }

    return this.callApi
  }

  callApi = (method, url, opts = {}) => {
    opts = Object.assign({}, this.opts, opts)
    opts.method = method

    if (typeof opts.body === 'object') {
      opts.body = JSON.stringify(opts.body)
    }

    return fetch(`/api/${this.prefix}${url}`, opts)
      .then(res => {
        if (res.ok) {
          const type = res.headers.get('Content-Type')
          return (type && type.includes('application/json')) ? res.json() : res
        }

        // error
        return res.text().then(txt => {
          return Promise.reject(new Error(txt))
        })
      })
  }
}
