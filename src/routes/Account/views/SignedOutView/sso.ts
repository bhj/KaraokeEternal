export interface SsoConfig {
  ssoMode: boolean
  ssoLoginUrl: string | null
}

export const buildSsoLoginUrl = (ssoLoginUrl: string, redirectPath: string): string => {
  const redirect = encodeURIComponent(redirectPath)
  return ssoLoginUrl.startsWith('/api/')
    ? `${ssoLoginUrl}?redirect=${redirect}`
    : `${ssoLoginUrl}?rd=${redirect}`
}

export const getSsoRedirectUrl = (config: SsoConfig | null, redirectPath: string): string | null => {
  if (!config?.ssoMode || !config.ssoLoginUrl) {
    return null
  }

  return buildSsoLoginUrl(config.ssoLoginUrl, redirectPath)
}
