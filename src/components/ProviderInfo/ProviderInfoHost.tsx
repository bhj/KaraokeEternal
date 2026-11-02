import React, { useCallback, useState } from 'react'
import ProviderInfo from './ProviderInfo'
import { ProviderInfoContext, type ProviderInfoData } from './ProviderInfoContext'

const ProviderInfoHost = ({ children }: { children: React.ReactNode }) => {
  const [info, setInfo] = useState<ProviderInfoData | null>(null)
  const [visible, setVisible] = useState(false)

  const open = useCallback((info: ProviderInfoData) => {
    setInfo(info)
    setVisible(true)
  }, [])

  const handleClose = useCallback(() => setVisible(false), [])

  return (
    <ProviderInfoContext value={open}>
      {children}
      <ProviderInfo info={info} isVisible={visible} onClose={handleClose} />
    </ProviderInfoContext>
  )
}

export default ProviderInfoHost
