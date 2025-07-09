export default class HttpApi {
  prefix: string
  options: RequestInit

  constructor (prefix = '') {
    this.prefix = prefix
    this.options = {
      credentials: 'same-origin',
    }
  }

  put = (url, options = {}) => this.request('PUT', url, options)
  post = (url, options = {}) => this.request('POST', url, options)
  get = (url, options = {}) => this.request('GET', url, options)
  delete = (url, options = {}) => this.request('DELETE', url, options)

  request = (method, url, options = {}) => {
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
      .then((res) => {
        if (res.ok) {
          const type = res.headers.get('Content-Type')
          return (type && type.includes('application/json')) ? res.json() : res
        }

        // error
        return res.text().then((txt) => { // eslint-disable-line promise/no-nesting
          throw new Error(txt)
        })
      })
  }
}
