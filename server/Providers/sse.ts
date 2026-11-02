// Bound on one event's accumulated data plus any partial line, so a
// misbehaving provider can't grow memory without bound. The provider API
// lets consumers reject a status event over 64 KiB. Measured in UTF-16 code
// units, which never exceeds the byte count.
const MAX_EVENT_CHARS = 64 * 1024

export class SseEventTooLongError extends Error {
  constructor () { super(`SSE event exceeded ${MAX_EVENT_CHARS} characters`) }
}

// index of the next line terminator (\r\n, \r, or \n), or -1
function indexOfLineEnd (s: string): number {
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '\n' || c === '\r') return i
  }
  return -1
}

/**
 * Parse a text/event-stream body, yielding the `data` payload of each event.
 * Multi-line data is joined with newlines per the spec. Comment lines and the
 * `event`, `id`, and `retry` fields are ignored. An event left incomplete when
 * the stream ends is discarded.
 */
export async function* parseSse (stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let data: string[] = []
  let dataChars = 0
  let done = false

  try {
    while (!done) {
      const chunk = await reader.read()
      done = chunk.done
      buffer += done ? decoder.decode() : decoder.decode(chunk.value, { stream: true })

      let idx: number
      while ((idx = indexOfLineEnd(buffer)) !== -1) {
        // a trailing \r may be the first half of \r\n; wait for the next chunk
        if (buffer[idx] === '\r' && idx === buffer.length - 1 && !done) break

        const line = buffer.slice(0, idx)
        const skip = buffer[idx] === '\r' && buffer[idx + 1] === '\n' ? 2 : 1
        buffer = buffer.slice(idx + skip)

        if (line === '') {
          if (data.length) {
            yield data.join('\n')
            data = []
            dataChars = 0
          }
          continue
        }
        if (line.startsWith(':')) continue

        const colon = line.indexOf(':')
        const field = colon === -1 ? line : line.slice(0, colon)
        if (field !== 'data') continue

        let value = colon === -1 ? '' : line.slice(colon + 1)
        if (value.startsWith(' ')) value = value.slice(1)
        data.push(value)
        dataChars += value.length
        if (dataChars > MAX_EVENT_CHARS) throw new SseEventTooLongError()
      }

      if (buffer.length + dataChars > MAX_EVENT_CHARS) {
        throw new SseEventTooLongError()
      }
    }
  } finally {
    if (!done) await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
