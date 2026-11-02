import React, { useCallback, useState } from 'react'
import ProviderInfo from './ProviderInfo'
import { ProviderInfoContext, type ProviderInfoData } from './ProviderInfoContext'

const ProviderInfoHost = ({ children }: { children: React.ReactNode }) => {
  const [info, setInfo] = useState<ProviderInfoData | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const open = useCallback((info: ProviderInfoData) => {
    setInfo(info)
    setIsVisible(true)
  }, [])

  const handleClose = useCallback(() => setIsVisible(false), [])

  return (
    <ProviderInfoContext.Provider value={open}>
      {children}
      <ProviderInfo info={info} isVisible={isVisible} onClose={handleClose} />
    </ProviderInfoContext.Provider>
  )
}

export default ProviderInfoHost
