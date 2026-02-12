import React from 'react'

interface InjectionLevelIndicatorProps {
  level?: string
  visible?: boolean
}

// Legacy no-op component kept to preserve API compatibility.
const InjectionLevelIndicator: React.FC<InjectionLevelIndicatorProps> = () => null

export default InjectionLevelIndicator
