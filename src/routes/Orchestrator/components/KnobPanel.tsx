import React, { useRef, useCallback } from 'react'
import styles from './KnobPanel.css'

interface KnobProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  color?: string
}

function Knob ({ label, value, min, max, step = 0.01, onChange, color = '#0ff' }: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ y: number, startValue: number } | null>(null)

  const range = max - min
  const normalized = (value - min) / range
  const angle = -135 + normalized * 270 // -135 to 135 degrees

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragStartRef.current = { y: e.clientY, startValue: value }
    const element = e.currentTarget
    element.setPointerCapture(e.pointerId)
  }, [value])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return
    const dy = dragStartRef.current.y - e.clientY
    const sensitivity = range / 150
    let newValue = dragStartRef.current.startValue + dy * sensitivity
    newValue = Math.max(min, Math.min(max, newValue))
    // Snap to step
    newValue = Math.round(newValue / step) * step
    onChange(newValue)
  }, [min, max, range, step, onChange])

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null
  }, [])

  return (
    <div className={styles.knob}>
      <div
        ref={knobRef}
        className={styles.knobDial}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ '--knob-color': color, '--knob-angle': `${angle}deg` } as React.CSSProperties}
      >
        <div className={styles.knobIndicator} />
      </div>
      <span className={styles.knobLabel}>{label}</span>
      <span className={styles.knobValue}>{value.toFixed(step >= 1 ? 0 : step >= 0.1 ? 1 : 2)}</span>
    </div>
  )
}

export interface KnobParam {
  key: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  color?: string
}

interface KnobPanelProps {
  title: string
  params: KnobParam[]
  onChange: (key: string, value: number) => void
  headerColor?: string
}

function KnobPanel ({ title, params, onChange, headerColor = '#333' }: KnobPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader} style={{ background: headerColor }}>
        {title}
      </div>
      <div className={styles.panelBody}>
        {params.map(p => (
          <Knob
            key={p.key}
            label={p.label}
            value={p.value}
            min={p.min}
            max={p.max}
            step={p.step}
            color={p.color}
            onChange={v => onChange(p.key, v)}
          />
        ))}
      </div>
    </div>
  )
}

export default KnobPanel
export { Knob }
