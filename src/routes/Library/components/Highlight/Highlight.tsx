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
        // eslint-disable-next-line @eslint-react/no-array-index-key -- parts of a split string; position is identity
        i % 2 === 1 ? <mark key={i}>{part}</mark> : part
      ))}
    </>
  )
}

export default React.memo(Highlight)
