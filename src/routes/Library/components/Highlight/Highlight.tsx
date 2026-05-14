import React from 'react'

interface HighlightProps {
  text: string
  pattern: RegExp | null
}

const Highlight = ({ text, pattern }: HighlightProps) => {
  if (!pattern) return <>{text}</>

  // Split with a capturing group: even indices are non-match, odd are matches.
  const parts = text.split(pattern)
  if (parts.length === 1) return <>{text}</>

  return (
    <>
      {parts.map((part, i) => (
        i % 2 === 1 ? <mark key={i}>{part}</mark> : part
      ))}
    </>
  )
}

export default React.memo(Highlight)
