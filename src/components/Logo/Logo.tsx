import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import styles from './Logo.css'

interface LogoProps {
  className?: string
}

// each letter and the ETERNAL border is a separate neon "tube"
const KARAOKE = [...'Karaoke'].map((char, i) => ({ char, id: i }))
const BORDER_ID = KARAOKE.length
const ETERNAL = [...'Eternal'].map((char, i) => ({ char, id: BORDER_ID + 1 + i }))
const TUBE_COUNT = KARAOKE.length + 1 + ETERNAL.length

// ms
const BLINK_DELAY = 150
const BLINK_DURATION = 600
const POWER_ON_SPREAD = 200

// one random tube flickers on first; the rest power on (staggered) once it's lit
const getPowerOnSequence = () => {
  const blinker = Math.floor(Math.random() * TUBE_COUNT)
  const delays = Array.from({ length: TUBE_COUNT }, (_, id) => id === blinker
    ? BLINK_DELAY
    : BLINK_DELAY + BLINK_DURATION + Math.random() * POWER_ON_SPREAD,
  )

  return { blinker, delays }
}

const Logo = (props: LogoProps) => {
  const [{ blinker, delays }] = useState(getPowerOnSequence)
  const [fontLoaded, setFontLoaded] = useState(() => {
    // if the font loading API is not supported, we can't wait for it
    return typeof document !== 'undefined' && !document.fonts
  })

  useEffect(() => {
    if (document.fonts) {
      document.fonts.load('1em Beon')
        .then(() => {
          setFontLoaded(true)
          return true
        })
        .catch(() => {
          setFontLoaded(true)
          return false
        })
    }
  }, [])

  const tubeProps = (id: number, className?: string) => ({
    className: clsx(className, id === blinker && styles.blinker),
    style: { '--delay': `${delays[id]}ms` } as React.CSSProperties,
  })

  return (
    <div
      className={clsx(styles.container, fontLoaded && styles.on, props.className)}
      style={{ '--blink-duration': `${BLINK_DURATION}ms` } as React.CSSProperties}
      role='img'
      aria-label='Karaoke Eternal'
    >
      <span className={styles.title} aria-hidden='true'>
        {KARAOKE.map(({ char, id }) => <span key={id} {...tubeProps(id, styles.letter)}>{char}</span>)}
        <span {...tubeProps(BORDER_ID, styles.eternal)}>
          {ETERNAL.map(({ char, id }, i) => (
            <span key={id} {...tubeProps(id, clsx(styles.letter, i === ETERNAL.length - 1 && styles.lastChar))}>
              {char}
            </span>
          ))}
        </span>
      </span>
    </div>
  )
}

export default Logo
