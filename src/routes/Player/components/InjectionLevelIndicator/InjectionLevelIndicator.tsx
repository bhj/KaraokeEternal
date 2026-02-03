import React, { useEffect, useRef, useState } from 'react'
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
  const [visible, setVisible] = useState(false)
  const prevRef = useRef(level)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (level === prevRef.current) return
    prevRef.current = level

    setVisible(true)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [level])

  if (!visible) return null

  return (
    <div className={styles.indicator}>
      Audio: {LABELS[level]}
    </div>
  )
}

export default InjectionLevelIndicator
