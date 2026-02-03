/**
 * Utilities for detecting and stripping auto-injected audio-reactive lines.
 * Shared between Orchestrator (editor UI) and Player (code normalization).
 * Imports only from lib/ — no cross-route imports.
 */

/** Strict exact-match patterns for injected lines (with variable multipliers) */
const INJECTED_PATTERNS = [
  // Default chain
  /^\s*\.modulate\(osc\(3,\s*0\.05\),\s*\(\)\s*=>\s*a\.fft\[0\]\s*\*\s*[\d.]+\)\s*$/,
  /^\s*\.rotate\(\(\)\s*=>\s*a\.fft\[1\]\s*\*\s*[\d.]+\)\s*$/,
  /^\s*\.scale\(\(\)\s*=>\s*0\.95\s*\+\s*a\.fft\[2\]\s*\*\s*[\d.]+\)\s*$/,
  /^\s*\.color\(1,\s*1\s*-\s*a\.fft\[\d\]\s*\*\s*[\d.]+,\s*1\s*\+\s*a\.fft\[\d\]\s*\*\s*[\d.]+\)\s*$/,
  // Camera / feedback / kaleid chains
  /^\s*\.saturate\(\(\)\s*=>\s*1\s*\+\s*a\.fft\[0\]\s*\*\s*[\d.]+\)\s*$/,
  /^\s*\.contrast\(\(\)\s*=>\s*1\s*\+\s*a\.fft\[1\]\s*\*\s*[\d.]+\)\s*$/,
  /^\s*\.brightness\(\(\)\s*=>\s*a\.fft\[0\]\s*\*\s*[\d.]+\)\s*$/,
]

/** Looser partial-match patterns (method + a.fft[N]) for lint warnings */
const PARTIAL_PATTERNS = [
  /\.modulate\(.*a\.fft\[0\]/,
  /\.rotate\(.*a\.fft\[1\]/,
  /\.scale\(.*a\.fft\[2\]/,
  /\.color\(.*a\.fft\[\d\]/,
  /\.saturate\(.*a\.fft\[0\]/,
  /\.contrast\(.*a\.fft\[1\]/,
  /\.brightness\(.*a\.fft\[0\]/,
]

/** Returns true if the line exactly matches an auto-injected pattern */
export function isInjectedLine (line: string): boolean {
  return INJECTED_PATTERNS.some(p => p.test(line))
}

/**
 * Returns true if the line is a user-modified version of an injected line.
 * Matches when a partial pattern hits but the strict exact pattern does NOT.
 * Used for lint warnings ("Modified audio injection — use Auto Audio to regenerate").
 */
export function isPartialInjectedLine (line: string): boolean {
  if (isInjectedLine(line)) return false
  return PARTIAL_PATTERNS.some(p => p.test(line))
}

/** Strip all auto-injected lines from code, preserving everything else */
export function stripInjectedLines (code: string): string {
  return code.split('\n').filter(line => !isInjectedLine(line)).join('\n')
}
