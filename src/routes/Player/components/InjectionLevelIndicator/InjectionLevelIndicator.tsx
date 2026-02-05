import React from 'react'
import type { InjectionLevel } from 'routes/Player/components/Player/PlayerVisualizer/hooks/audioInjectProfiles'
import styles from './InjectionLevelIndicator.css'

interface InjectionLevelIndicatorProps {
  level: InjectionLevel
}

const LABELS: Record<InjectionLevel, string> = {
  low: 'Low',
  med: 'Med',
  high: 'High',
}

function InjectionLevelIndicator ({ level }: InjectionLevelIndicatorProps) {
  return (
    <div key={level} className={styles.indicator}>
      <span>Audio:</span>
      <span>{LABELS[level]}</span>
    </div>
  )
}

export default InjectionLevelIndicator
