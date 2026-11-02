import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'
import { _SUCCESS, _ERROR } from '../../shared/actionTypes.js'

// Force the module to take the parent branch. The module reads
// `process.env.KES_CHILD_PROCESS` at import time; absence means "parent".
delete process.env.KES_CHILD_PROCESS

// Import after the env mutation so isParent === true.
const IPC = (await import('./IPCBridge.js')).default as unknown as {
  children: Map<number, { send: ReturnType<typeof vi.fn>, pid: number }>
  handlers: Record<string, (action: { type: string, payload?: unknown, meta?: { reqId?: number, pid?: number, parent?: boolean } }) => unknown>
  requests: Record<number, { resolve: (v: unknown) => void, reject: (err: unknown) => void, pid: number }>
  reqId: number
  send: (action: object, pid?: number) => void
  handle: (action: object) => void
  req: (action: { type: string, payload?: unknown }, pid?: number) => Promise<unknown>
  addChild: (sub: object) => void
  removeChild: (sub: object) => void
  use: (obj: Record<string, (action: unknown) => unknown>) => void
}

// Mock child: EventEmitter-ish stub with a .send() spy and a .pid.
function makeFakeChild (pid: number) {
  const ee = new EventEmitter() as EventEmitter & { pid: number, send: ReturnType<typeof vi.fn> }
  ee.pid = pid
  ee.send = vi.fn()
  return ee
}

describe('IPCParent.req (parent → child request/response)', () => {
  beforeEach(() => {
    // Clear cross-test state on the singleton.
    IPC.children.clear()
    for (const k of Object.keys(IPC.handlers)) delete IPC.handlers[k]
    for (const k of Object.keys(IPC.requests)) delete IPC.requests[Number(k)]
    IPC.reqId = 0
  })

  it('returns a Promise resolved by a matching +_SUCCESS inbound', async () => {
    const child = makeFakeChild(1111)
    IPC.addChild(child)

    const promise = IPC.req({ type: 'DO_THING', payload: { x: 1 } }, 1111)

    // Inspect what was sent to the child to capture the assigned reqId.
    expect(child.send).toHaveBeenCalledTimes(1)
    const sent = child.send.mock.calls[0][0] as { type: string, meta: { reqId: number, pid: number, parent: boolean }, payload: unknown }
    expect(sent.type).toBe('DO_THING')
    expect(sent.meta.parent).toBe(true)
    expect(sent.meta.pid).toBe(1111)
    expect(sent.meta.reqId).toBeGreaterThan(0)
    expect(sent.payload).toEqual({ x: 1 })

    // Simulate the child auto-reply.
    child.emit('message', {
      type: 'DO_THING' + _SUCCESS,
      meta: { reqId: sent.meta.reqId, pid: 1111, parent: true },
      payload: { ok: true },
    })

    await expect(promise).resolves.toEqual({ ok: true })
  })

  it('rejects on +_ERROR reply with the error from the message', async () => {
    const child = makeFakeChild(2222)
    IPC.addChild(child)

    const promise = IPC.req({ type: 'BLOW_UP' }, 2222)
    const sent = child.send.mock.calls[0][0] as { meta: { reqId: number } }

    child.emit('message', {
      type: 'BLOW_UP' + _ERROR,
      meta: { reqId: sent.meta.reqId, pid: 2222, parent: true },
      error: new Error('boom'),
    })

    await expect(promise).rejects.toThrow('boom')
  })

  it('rejects all pending requests targeting a child when removeChild is called', async () => {
    const child = makeFakeChild(3333)
    IPC.addChild(child)

    const a = IPC.req({ type: 'A' }, 3333)
    const b = IPC.req({ type: 'B' }, 3333)

    IPC.removeChild(child)

    await expect(a).rejects.toThrow(/3333 exited/)
    await expect(b).rejects.toThrow(/3333 exited/)
  })

  it('rejects immediately when target pid is unknown', async () => {
    await expect(IPC.req({ type: 'NOPE' }, 9999)).rejects.toThrow(/no child with pid 9999/)
  })

  it('does not consume a child-originated request (different reqId-counter origins)', async () => {
    // Scenario: child sends a request to parent (e.g. LIBRARY_MATCH_SONG) with
    // meta.pid = childPid and no meta.parent flag. The parent's handle() must
    // NOT mistake this for a reply to one of its own requests, even if the
    // child's reqId happens to equal a parent's pending reqId.
    const child = makeFakeChild(4444)
    IPC.addChild(child)

    // Parent issues a request and stays pending. Captures reqId=1.
    IPC.req({ type: 'PARENT_ASK' }, 4444)
    const parentReqId = (child.send.mock.calls[0][0] as { meta: { reqId: number } }).meta.reqId

    // Parent-side handler for the inbound child request.
    const handler = vi.fn(() => 'parent-side-result')
    IPC.use({ CHILD_ASK: handler })

    // Child sends a request to parent. Use the SAME reqId number — this is the
    // collision scenario we're guarding against.
    child.emit('message', {
      type: 'CHILD_ASK',
      meta: { reqId: parentReqId, pid: 4444 }, // no `parent: true`
      payload: { from: 'child' },
    })

    // The parent's handler ran (request was NOT misrouted to the pending parent
    // promise).
    expect(handler).toHaveBeenCalledTimes(1)
    // And the auto-reply went back to the child.
    const sends = child.send.mock.calls
    expect(sends.length).toBeGreaterThanOrEqual(2)
    const replyCall = sends[sends.length - 1][0] as { type: string, payload: unknown }
    expect(replyCall.type).toBe('CHILD_ASK' + _SUCCESS)
    expect(replyCall.payload).toBe('parent-side-result')
  })
})
