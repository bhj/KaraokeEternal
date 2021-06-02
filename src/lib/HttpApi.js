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

    // assume we're sending JSON if not multipart form data
    if (typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      opts.headers = new Headers({
        'Content-Type': 'application/json',
      })

      opts.body = JSON.stringify(opts.body)
    }

    return fetch(`${document.baseURI}api/${this.prefix}${url}`, opts)
      .then(res => {
        if (res.ok) {
          const type = res.headers.get('Content-Type')
          return (type && type.includes('application/json')) ? res.json() : res
        }

        // error
        return res.text().then(txt => { throw new Error(txt) }) // eslint-disable-line promise/no-nesting
      })
  }
}
