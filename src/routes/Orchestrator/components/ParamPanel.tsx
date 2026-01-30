import React, { useCallback, useEffect, useRef, useState } from 'react'
import { valueFromDelta, valueFromPosition } from './paramUtils'
import styles from './ParamPanel.css'

export interface ParamRow {
  key: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  audioSource?: string | null
  accentColor?: string
}

interface ParamPanelProps {
  params: ParamRow[]
  audioInputs: string[]
  onChange: (key: string, value: number) => void
  onAudioChange: (key: string, audioInput: string | null) => void
}

interface DragState {
  key: string
  startValue: number
  startX: number
  startY: number
  trackLeft: number
  trackWidth: number
  min: number
  max: number
  step?: number
}

function formatValue (value: number, step?: number): string {
  if (!step || step >= 1) return value.toFixed(0)
  if (step >= 0.1) return value.toFixed(1)
  if (step >= 0.01) return value.toFixed(2)
  return value.toFixed(3)
}

function ParamPanel ({ params, audioInputs, onChange, onAudioChange }: ParamPanelProps) {
  const dragRef = useRef<DragState | null>(null)
  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [audioPickerKey, setAudioPickerKey] = useState<string | null>(null)

  const closeAudioPicker = useCallback(() => setAudioPickerKey(null), [])

  useEffect(() => {
    if (!audioPickerKey) return
    const handler = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-audio-badge]') || target.closest('[data-audio-popover]')) {
        return
      }
      closeAudioPicker()
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [audioPickerKey, closeAudioPicker])

  const handlePointerDown = useCallback((param: ParamRow, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const track = trackRefs.current[param.key]
    if (!track) return
    const rect = track.getBoundingClientRect()
    const nextValue = valueFromPosition(e.clientX, rect.left, rect.width, param.min, param.max, param.step)
    onChange(param.key, nextValue)
    setActiveKey(param.key)

    dragRef.current = {
      key: param.key,
      startValue: nextValue,
      startX: e.clientX,
      startY: e.clientY,
      trackLeft: rect.left,
      trackWidth: rect.width,
      min: param.min,
      max: param.max,
      step: param.step,
    }

    e.currentTarget.setPointerCapture(e.pointerId)
  }, [onChange])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const drag = dragRef.current
    const nextValue = valueFromDelta({
      startValue: drag.startValue,
      deltaX: e.clientX - drag.startX,
      deltaY: e.clientY - drag.startY,
      trackWidth: drag.trackWidth,
      min: drag.min,
      max: drag.max,
      step: drag.step,
    })
    onChange(drag.key, nextValue)
  }, [onChange])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  return (
    <div
      className={styles.panel}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {params.map(param => {
        const percent = ((param.value - param.min) / (param.max - param.min)) * 100
        const isActive = activeKey === param.key
        const isPickerOpen = audioPickerKey === param.key
        const audioLabel = param.audioSource ? param.audioSource.toUpperCase() : 'OFF'
        const audioAccent = param.audioSource ? styles.audioActive : ''

        return (
          <div key={param.key} className={`${styles.paramRow} ${isActive ? styles.paramRowActive : ''}`}>
            <div className={styles.paramHeader}>
              <span className={styles.paramLabel}>{param.label}</span>
              <button
                type='button'
                className={`${styles.audioBadge} ${audioAccent}`}
                data-audio-badge='true'
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setAudioPickerKey(isPickerOpen ? null : param.key)}
              >
                <span className={styles.audioBadgeIcon}>◆</span>
                <span className={styles.audioBadgeText}>{audioLabel}</span>
              </button>
              <span className={styles.paramValue}>{formatValue(param.value, param.step)}</span>
            </div>
            <div
              className={styles.sliderTrack}
              ref={el => { trackRefs.current[param.key] = el }}
              onPointerDown={e => handlePointerDown(param, e)}
            >
              <div className={styles.sliderFill} style={{ width: `${percent}%`, background: param.audioSource ? '#d4a017' : undefined }} />
              <div className={styles.sliderThumb} style={{ left: `${percent}%` }} />
            </div>
            {isPickerOpen && (
              <div className={styles.audioPopover} data-audio-popover='true'>
                <button
                  type='button'
                  className={`${styles.audioOption} ${param.audioSource ? '' : styles.audioOptionActive}`}
                  onClick={() => { onAudioChange(param.key, null); closeAudioPicker() }}
                >
                  Off
                </button>
                {audioInputs.map(input => (
                  <button
                    key={input}
                    type='button'
                    className={`${styles.audioOption} ${param.audioSource === input ? styles.audioOptionActive : ''}`}
                    onClick={() => { onAudioChange(param.key, input); closeAudioPicker() }}
                  >
                    {input}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ParamPanel
