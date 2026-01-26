export default class HttpApi {
  prefix: string
  options: RequestInit

  constructor (prefix = '') {
    this.prefix = prefix
    this.options = {
      credentials: 'same-origin',
    }
  }

  put = <T = Record<string, unknown>>(url: string, options = {}) => this.request<T>('PUT', url, options)
  post = <T = Record<string, unknown>>(url: string, options = {}) => this.request<T>('POST', url, options)
  get = <T = Record<string, unknown>>(url: string, options = {}) => this.request<T>('GET', url, options)
  delete = <T = Record<string, unknown>>(url: string, options = {}) => this.request<T>('DELETE', url, options)

  request = async <T = Record<string, unknown> | Response>(
    method: string,
    url: string,
    options = {},
  ): Promise<T> => {
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

    const res = await fetch(`${document.baseURI}api/${this.prefix}${url}`, opts)

    // Auto-redirect to OIDC login on 401 (Unauthorized)
    // This enables seamless SSO: protected API → 401 → login → callback → original page
    if (res.status === 401) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `${document.baseURI}api/auth/login?redirect=${redirect}`
      // Throw to stop execution (redirect will navigate away)
      throw new Error('Unauthorized - redirecting to login')
    }

    if (res.ok) {
      const contentType = res.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid API response')
      }
      return res.json()
    }

    const txt = await res.text()
    throw new Error(txt)
  }
}
