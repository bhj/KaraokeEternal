import { describe, it, expect } from 'vitest'
import { parseNdjson, NdjsonLineTooLongError } from './ndjson.js'

function streamOf (chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start (controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c))
      controller.close()
    },
  })
}

// a stream that never closes on its own, so cancellation is observable
function openStreamOf (chunks: string[]): { stream: ReadableStream<Uint8Array>, canceled: () => boolean } {
  const enc = new TextEncoder()
  let canceled = false
  const stream = new ReadableStream<Uint8Array>({
    start (controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c))
    },
    cancel () {
      canceled = true
    },
  })
  return { stream, canceled: () => canceled }
}

async function collect (chunks: string[]): Promise<unknown[]> {
  const out: unknown[] = []
  for await (const v of parseNdjson(streamOf(chunks))) out.push(v)
  return out
}

const big = JSON.stringify({ title: 'x'.repeat(70_000) }) + '\n'

describe('parseNdjson', () => {
  it('yields each line parsed', async () => {
    await expect(collect(['[1]\n{"a":1}\n'])).resolves.toEqual([[1], { a: 1 }])
  })

  it('skips blank lines and parses an unterminated last line', async () => {
    await expect(collect(['[1]\n\n\n[2]'])).resolves.toEqual([[1], [2]])
  })

  it('reassembles a line split across chunks, including inside a multi-byte character', async () => {
    const bytes = new TextEncoder().encode('["é"]\n')
    const stream = new ReadableStream<Uint8Array>({
      start (c) {
        c.enqueue(bytes.slice(0, 3))
        c.enqueue(bytes.slice(3))
        c.close()
      },
    })
    const out: unknown[] = []
    for await (const v of parseNdjson(stream)) out.push(v)
    expect(out).toEqual([['é']])
  })

  it('rejects an oversized line that arrives in one chunk', async () => {
    await expect(collect([big])).rejects.toBeInstanceOf(NdjsonLineTooLongError)
  })

  it('rejects an oversized line split across chunks', async () => {
    await expect(collect([big.slice(0, 40_000), big.slice(40_000)])).rejects.toBeInstanceOf(NdjsonLineTooLongError)
  })

  it('rejects an oversized unterminated last line', async () => {
    await expect(collect([big.trimEnd()])).rejects.toBeInstanceOf(NdjsonLineTooLongError)
  })

  it('measures the cap in bytes, not characters', async () => {
    // 40k three-byte characters is under the cap in length but over it in bytes
    await expect(collect([JSON.stringify({ t: '€'.repeat(40_000) }) + '\n'])).rejects.toBeInstanceOf(NdjsonLineTooLongError)
  })

  it('cancels the stream when the consumer stops early', async () => {
    const { stream, canceled } = openStreamOf(['[1]\n[2]\n'])
    for await (const _ of parseNdjson(stream)) break // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(canceled()).toBe(true)
  })

  it('cancels the stream when a line is rejected', async () => {
    const { stream, canceled } = openStreamOf([big])
    await expect((async () => {
      for await (const _ of parseNdjson(stream)) { /* drain */ } // eslint-disable-line @typescript-eslint/no-unused-vars
    })()).rejects.toBeInstanceOf(NdjsonLineTooLongError)
    expect(canceled()).toBe(true)
  })
})
