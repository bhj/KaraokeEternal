import type { ProviderFetchStatus } from '../../routes/Library/modules/library'

export const isInFlight = (status: ProviderFetchStatus | undefined): boolean =>
  status === 'pending' || status === 'downloading'
