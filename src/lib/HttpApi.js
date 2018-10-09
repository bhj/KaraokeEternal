export default class HttpApi {
  constructor (prefix = '') {
    this.prefix = prefix
    this.options = {
      credentials: 'same-origin',
    }

    return this.callApi
  }

  callApi = (method, url, options = {}) => {
    const opts = {
      ...this.options,
      ...options,
      method,
    }

    if (typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
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
