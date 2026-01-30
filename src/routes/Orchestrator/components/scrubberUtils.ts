export interface ScrubberMatch {
  charStart: number
  charEnd: number
  value: number
}

/**
 * Finds the numeric literal at or near the cursor position in code.
 *
 * Context-aware unary minus detection: a leading `-` is treated as unary
 * (part of the number) if preceded by a non-identifier/non-digit/non-`.`/non-`)` char,
 * or at the start of the string. This correctly handles:
 *   `*-3` → `-3` (unary after operator)
 *   `(-3` → `-3` (unary after paren)
 *   `,-3` → `-3` (unary after comma)
 *   `=-3` → `-3` (unary after assignment)
 *   `-3` at start → `-3` (unary)
 *   `x-3` → `3` only (subtraction — the `-` belongs to the operator)
 */
export function findNumberAtCursor (code: string, cursorPos: number): ScrubberMatch | null {
  // Match all numbers (with optional leading minus)
  const numberRegex = /-?\d+\.?\d*/g
  let match: RegExpExecArray | null

  while ((match = numberRegex.exec(code)) !== null) {
    const matchStart = match.index
    const matchEnd = matchStart + match[0].length
    const matchStr = match[0]

    // Check if cursor falls within this match
    if (cursorPos < matchStart || cursorPos >= matchEnd) continue

    // If the match starts with '-', determine if it's unary or subtraction
    if (matchStr.startsWith('-')) {
      if (matchStart > 0) {
        const charBefore = code[matchStart - 1]
        // If the char before is an identifier char, digit, '.', or ')',
        // this is subtraction, not unary minus
        if (/[\w.)]/u.test(charBefore)) {
          // Re-interpret: the number is just the digits after the minus
          const numStart = matchStart + 1
          const numEnd = matchEnd
          if (cursorPos >= numStart && cursorPos < numEnd) {
            return {
              charStart: numStart,
              charEnd: numEnd,
              value: parseFloat(matchStr.slice(1)),
            }
          }
          // Cursor was on the minus sign itself, which is a subtraction operator
          continue
        }
      }
      // Start of string or preceded by an operator/paren/comma → unary minus
    }

    return {
      charStart: matchStart,
      charEnd: matchEnd,
      value: parseFloat(matchStr),
    }
  }

  return null
}

/**
 * Replaces a substring in code at [start, end) with newValue.
 */
export function spliceNumber (code: string, start: number, end: number, newValue: string): string {
  return code.slice(0, start) + newValue + code.slice(end)
}

/**
 * Returns sensible range and step for a scrubber slider given the current value.
 *
 * Heuristics:
 *   [0, 1]   → min=0, max=1, step=0.01
 *   (1, 10]  → min=0, max=value*3, step=0.1
 *   >10      → min=0, max=value*3, step=1
 *   negative → symmetric around zero, step based on abs(value)
 */
export function getScrubberRange (value: number): { min: number, max: number, step: number } {
  const abs = Math.abs(value)

  if (value < 0) {
    const step = abs <= 1 ? 0.01 : abs <= 10 ? 0.1 : 1
    return { min: value * 2, max: abs * 2, step }
  }

  if (abs <= 1) {
    return { min: 0, max: 1, step: 0.01 }
  }

  if (abs <= 10) {
    return { min: 0, max: value * 3, step: 0.1 }
  }

  return { min: 0, max: value * 3, step: 1 }
}
