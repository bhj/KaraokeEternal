// Per the provider API, no NDJSON line may exceed this when UTF-8 encoded,
// and consumers must abort the stream if one does
const MAX_LINE_BYTES = 64 * 1024

export class NdjsonLineTooLongError extends Error {
  constructor () { super(`NDJSON line exceeded ${MAX_LINE_BYTES} bytes`) }
}

/**
 * Parse an NDJSON body, yielding each line's parsed value. The underlying
 * stream is canceled if the consumer stops early or a line is rejected.
 */
export async function* parseNdjson (
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<unknown> {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let done = false

  const parseLine = (line: string): unknown => {
    if (Buffer.byteLength(line, 'utf8') > MAX_LINE_BYTES) throw new NdjsonLineTooLongError()
    return JSON.parse(line)
  }

  try {
    while (!done) {
      const chunk = await reader.read()
      done = chunk.done
      buffer += done ? decoder.decode() : decoder.decode(chunk.value, { stream: true })

      let nl: number
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim()
        buffer = buffer.slice(nl + 1)
        if (line) yield parseLine(line)
      }

      // a partial line already over the cap can't become a valid one
      if (Buffer.byteLength(buffer, 'utf8') > MAX_LINE_BYTES) {
        throw new NdjsonLineTooLongError()
      }
    }

    const tail = buffer.trim()
    if (tail) yield parseLine(tail)
  } finally {
    if (!done) await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
