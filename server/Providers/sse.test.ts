import { describe, it, expect } from 'vitest'
import { parseSse, SseEventTooLongError } from './sse.js'

function streamOf (chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start (controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c))
      controller.close()
    },
  })
}

async function collect (chunks: string[]): Promise<string[]> {
  const out: string[] = []
  for await (const data of parseSse(streamOf(chunks))) out.push(data)
  return out
}

describe('parseSse', () => {
  it('yields the data of each event', async () => {
    await expect(collect(['data: one\n\ndata: two\n\n'])).resolves.toEqual(['one', 'two'])
  })

  it('joins multi-line data with newlines', async () => {
    await expect(collect(['data: a\ndata: b\n\n'])).resolves.toEqual(['a\nb'])
  })

  it('ignores comments and non-data fields', async () => {
    await expect(collect([': keepalive\n\nevent: x\nid: 1\nretry: 5\ndata: d\n\n'])).resolves.toEqual(['d'])
  })

  it('strips a single leading space from the value', async () => {
    await expect(collect(['data:  two spaces\n\ndata:none\n\n'])).resolves.toEqual([' two spaces', 'none'])
  })

  it('reassembles an event split across chunks', async () => {
    await expect(collect(['da', 'ta: he', 'llo\n', '\n'])).resolves.toEqual(['hello'])
  })

  it('accepts \\r\\n and \\r line endings, including \\r\\n split across chunks', async () => {
    await expect(collect(['data: a\r\n\r\n', 'data: b\r', '\n\r\n', 'data: c\r\r'])).resolves.toEqual(['a', 'b', 'c'])
  })

  it('discards an event left incomplete at end of stream', async () => {
    await expect(collect(['data: done\n\ndata: partial\n'])).resolves.toEqual(['done'])
  })

  it('rejects an event that exceeds the size cap', async () => {
    await expect(collect([`data: ${'x'.repeat(70_000)}\n\n`])).rejects.toBeInstanceOf(SseEventTooLongError)
  })

  it('rejects an unterminated line that exceeds the size cap', async () => {
    await expect(collect(['data: ' + 'x'.repeat(70_000)])).rejects.toBeInstanceOf(SseEventTooLongError)
  })

  it('cancels the stream when the consumer stops early', async () => {
    let canceled = false
    const stream = new ReadableStream<Uint8Array>({
      start (c) { c.enqueue(new TextEncoder().encode('data: a\n\ndata: b\n\n')) },
      cancel () { canceled = true },
    })
    for await (const _ of parseSse(stream)) break // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(canceled).toBe(true)
  })
})
