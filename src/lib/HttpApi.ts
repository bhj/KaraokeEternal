interface RequestOptions extends RequestInit {
  body?: BodyInit | Record<string, unknown> | null
  skipAuthRedirect?: boolean // Don't auto-redirect to login on 401
}

export default class HttpApi {
  prefix: string
  options: RequestInit

  constructor (prefix = '') {
    this.prefix = prefix
    this.options = {
      credentials: 'same-origin',
    }
  }

  put = <T = Record<string, unknown>>(url: string, options: RequestOptions = {}) => this.request<T>('PUT', url, options)
  post = <T = Record<string, unknown>>(url: string, options: RequestOptions = {}) => this.request<T>('POST', url, options)
  get = <T = Record<string, unknown>>(url: string, options: RequestOptions = {}) => this.request<T>('GET', url, options)
  delete = <T = Record<string, unknown>>(url: string, options: RequestOptions = {}) => this.request<T>('DELETE', url, options)

  request = async <T = Record<string, unknown> | Response>(
    method: string,
    url: string,
    options: RequestOptions = {},
  ): Promise<T> => {
    const { skipAuthRedirect, ...fetchOptions } = options
    const opts = {
      ...this.options,
      ...fetchOptions,
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
    // Skip redirect for session checks (let caller handle 401 gracefully)
    if (res.status === 401 && !skipAuthRedirect) {
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
