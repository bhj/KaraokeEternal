import { createContext, useContext } from 'react'
import type { ProviderFetchStatus } from 'routes/Library/modules/library'

export interface ProviderInfoData {
  providerId: number
  itemId: string
  title: string
  artist: string
  source?: string
  status?: ProviderFetchStatus
  error?: string
}

// The context value is a stable open() fn, so trigger components that call
// useProviderInfo() don't re-render when the modal opens or closes.
export const ProviderInfoContext = createContext<(info: ProviderInfoData) => void>(() => {})

export const useProviderInfo = () => useContext(ProviderInfoContext)
