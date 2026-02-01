import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export const hydraHighlightStyle = HighlightStyle.define([
  { tag: tags.function(tags.variableName), color: '#7ee787' },
  { tag: [tags.number, tags.integer, tags.float], color: '#d2a8ff' },
  { tag: [tags.string, tags.special(tags.string)], color: '#a5d6ff' },
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword], color: '#f0883e' },
  { tag: tags.comment, color: '#6e7681', fontStyle: 'italic' },
  { tag: [tags.operator, tags.punctuation, tags.separator], color: '#9da7b3' },
  { tag: tags.variableName, color: '#c9d1d9' },
  { tag: tags.propertyName, color: '#7ee787' },
  { tag: [tags.bool, tags.null], color: '#d2a8ff' },
])

export const hydraHighlight = syntaxHighlighting(hydraHighlightStyle)
