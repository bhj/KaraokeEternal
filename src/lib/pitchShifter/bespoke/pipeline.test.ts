import { SoundTouch } from '@soundtouchjs/core'
import { describe, expect, it } from 'vitest'
import { ANALYSIS_HOP, FFT_SIZE, LATENCY_FRAMES, RENDER_QUANTUM } from './constants'
import { quantizePitch } from './pitch'
import { pipeOptions, prefill } from './pipe'

const SR = 44100

/**
 * Drives SoundTouch exactly as SoundTouchProcessorBase.processCore does — put a
 * render block, process, extract min(available, block), leaving any shortfall as
 * the silence the base class would write — so what this measures is what the
 * worklet does. Pitch goes through quantizePitch for the same reason.
 */
function render (l: Float32Array, r: Float32Array, semitones: number) {
  const pipe = new SoundTouch(pipeOptions(SR))
  prefill(pipe)
  pipe.pitch = quantizePitch(semitones)

  const outL = new Float32Array(l.length)
  const outR = new Float32Array(l.length)
  const staging = new Float32Array(RENDER_QUANTUM * 2)
  const extracted = new Float32Array(RENDER_QUANTUM * 2)
  const blocks = Math.floor(l.length / RENDER_QUANTUM)
  const available: number[] = []

  for (let b = 0; b < blocks; b++) {
    const offset = b * RENDER_QUANTUM

    for (let i = 0; i < RENDER_QUANTUM; i++) {
      staging[i * 2] = l[offset + i]
      staging[i * 2 + 1] = r[offset + i]
    }

    pipe.inputBuffer.putSamples(staging, 0, RENDER_QUANTUM)
    pipe.process()

    const have = pipe.outputBuffer.frameCount
    available.push(have)
    const toExtract = Math.min(have, RENDER_QUANTUM)

    if (toExtract > 0) {
      pipe.outputBuffer.extract(extracted, 0, toExtract)
      pipe.outputBuffer.receive(toExtract)

      for (let i = 0; i < toExtract; i++) {
        outL[offset + i] = extracted[i * 2]
        outR[offset + i] = extracted[i * 2 + 1]
      }
    }
  }

  return { l: outL, r: outR, available }
}

function sine (freq: number, n: number, amp = 1): Float32Array {
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin(2 * Math.PI * freq * i / SR)
  return out
}

function noise (n: number, seed = 1): Float32Array {
  const out = new Float32Array(n)
  let s = seed

  for (let i = 0; i < n; i++) {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    out[i] = (s % 2000) / 1000
  }

  return out
}

/** Rising zero crossings per second — accurate on the clean tones used here. */
function estimateFreq (x: Float32Array, from: number, to: number): number {
  let crossings = 0
  for (let i = from; i < to - 1; i++) {
    if (x[i] < 0 && x[i + 1] >= 0) crossings++
  }
  return crossings * SR / (to - from)
}

const rms = (x: Float32Array, from = 0, to = x.length) => {
  let sum = 0
  for (let i = from; i < to; i++) sum += x[i] * x[i]
  return Math.sqrt(sum / Math.max(1, to - from))
}

const db = (ratio: number) => 20 * Math.log10(ratio)

/** Lag maximizing correlation of out[i] against input[i - lag]. */
function measureLag (input: Float32Array, out: Float32Array, maxLag: number) {
  const at = maxLag * 2
  const win = 4096
  let best = { lag: 0, corr: -2 }

  for (let lag = 0; lag <= maxLag; lag++) {
    let num = 0
    let a = 0
    let b = 0

    for (let i = 0; i < win; i++) {
      const x = out[at + i]
      const y = input[at + i - lag]
      num += x * y
      a += x * x
      b += y * y
    }

    const corr = num / Math.sqrt(a * b || 1)
    if (corr > best.corr) best = { lag, corr }
  }

  return best
}

const SEMITONES = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]

describe('quantizePitch', () => {
  it('lands on a whole number of frames per hop', () => {
    for (const semitones of SEMITONES) {
      const hop = ANALYSIS_HOP * quantizePitch(semitones)

      expect(hop).toBeCloseTo(Math.round(hop), 9)
    }
  })

  it('stays within a fiftieth of a semitone of the request', () => {
    for (const semitones of SEMITONES) {
      const realized = 12 * Math.log2(quantizePitch(semitones))

      expect(Math.abs(realized - semitones)).toBeLessThan(0.02)
    }
  })

  it('is exactly 1 at no shift', () => {
    expect(quantizePitch(0)).toBe(1)
  })
})

describe('pitch shifter pipeline', () => {
  it('passes audio through at 0 semitones', () => {
    const input = noise(SR * 2)
    const out = render(input, input, 0)

    for (let i = LATENCY_FRAMES + FFT_SIZE; i < input.length - FFT_SIZE; i++) {
      expect(out.l[i]).toBeCloseTo(input[i - LATENCY_FRAMES], 3)
    }
  })

  it('reports the group delay it actually has', () => {
    // The value CDGPlayer subtracts from currentTime to keep lyrics on the
    // beat, so a drift here is visible on screen.
    const input = noise(SR * 2)
    const measured = measureLag(input, render(input, input, 0).l, FFT_SIZE * 2)

    expect(measured.corr).toBeGreaterThan(0.99)
    expect(measured.lag).toBe(LATENCY_FRAMES)
  })

  it.each(SEMITONES)('shifts pitch by %i semitones, keeping duration', (semitones) => {
    const freq = 220
    const input = sine(freq, SR * 3)
    const out = render(input, input, semitones)

    expect(estimateFreq(out.l, SR, SR * 2))
      .toBeCloseTo(freq * Math.pow(2, semitones / 12), -1)
    // still sounding at the end, so nothing was consumed or stretched away
    expect(rms(out.l, input.length - SR, input.length)).toBeGreaterThan(0.1)
  })

  it('holds a tone at its original level', () => {
    const input = sine(1000, SR * 3)
    const reference = rms(input, FFT_SIZE, input.length - FFT_SIZE)

    for (const semitones of [-6, -3, 3, 6]) {
      const level = rms(render(input, input, semitones).l,
        LATENCY_FRAMES + FFT_SIZE, input.length - FFT_SIZE)

      expect(Math.abs(db(level / reference))).toBeLessThan(0.5)
    }
  })

  it('holds broadband level within 1.5 dB', () => {
    // Some loss is inherent to resynthesizing noise-like content at a different
    // hop; the stage's peak locking is what keeps it near a dB instead of ~3.
    const input = noise(SR * 3)
    const reference = rms(input, FFT_SIZE, input.length - FFT_SIZE)

    for (const semitones of [-6, -5, -3, -1, 3, 6]) {
      const level = rms(render(input, input, semitones).l,
        LATENCY_FRAMES + FFT_SIZE, input.length - FFT_SIZE)

      expect(Math.abs(db(level / reference))).toBeLessThan(1.5)
    }
  })

  it('keeps identical channels identical', () => {
    const input = noise(SR)
    const out = render(input, Float32Array.from(input), 4)

    for (let i = 0; i < out.l.length; i++) {
      expect(out.r[i]).toBe(out.l[i])
    }
  })

  it('holds level on anti-phase channels', () => {
    // Anti-phase content cancels in the mid signal, so a mid-only phase
    // reference goes noisy and costs several dB. Each peak picking the stronger
    // of mid/side is what keeps this case intact.
    const input = noise(SR * 3)
    const inverted = new Float32Array(input.length)
    for (let i = 0; i < input.length; i++) inverted[i] = -input[i]

    const out = render(input, inverted, 6)
    const from = LATENCY_FRAMES + FFT_SIZE
    const to = input.length - FFT_SIZE

    expect(Math.abs(db(rms(out.l, from, to) / rms(input, FFT_SIZE, to))))
      .toBeLessThan(1.5)
    expect(rms(out.r, from, to)).toBeCloseTo(rms(out.l, from, to), 4)
  })

  it.each(SEMITONES)('neither starves nor accumulates at %i semitones', (semitones) => {
    // What quantizePitch is for. An unquantized ratio leaves the stretch and
    // resample factors disagreeing by up to 0.11%, so over a long run the output
    // buffer either climbs without bound (latency creep) or drains to nothing
    // (silence-filled gaps). Both would show here.
    const out = render(sine(440, SR * 15), sine(440, SR * 15), semitones)
    // skip the priming blocks, where the buffer legitimately starts empty
    const settled = out.available.slice(Math.ceil(FFT_SIZE * 2 / RENDER_QUANTUM))
    const tenth = Math.floor(settled.length / 10)

    // never short of a full block to hand back
    expect(Math.min(...settled)).toBeGreaterThanOrEqual(RENDER_QUANTUM)

    // and the trough is where it started, so nothing is creeping
    const firstTrough = Math.min(...settled.slice(0, tenth))
    const lastTrough = Math.min(...settled.slice(9 * tenth))
    expect(Math.abs(lastTrough - firstTrough)).toBeLessThan(RENDER_QUANTUM)
  })

  it('survives pitch changes mid-stream', () => {
    const input = sine(330, SR * 2)
    const pipe = new SoundTouch(pipeOptions(SR))
    prefill(pipe)

    const staging = new Float32Array(RENDER_QUANTUM * 2)
    const extracted = new Float32Array(RENDER_QUANTUM * 2)
    const out = new Float32Array(input.length)
    const blocks = Math.floor(input.length / RENDER_QUANTUM)
    const steps = [0, 3, -2, 6]

    for (let b = 0; b < blocks; b++) {
      const offset = b * RENDER_QUANTUM
      pipe.pitch = quantizePitch(steps[Math.floor(b / blocks * steps.length)])

      for (let i = 0; i < RENDER_QUANTUM; i++) {
        staging[i * 2] = input[offset + i]
        staging[i * 2 + 1] = input[offset + i]
      }

      pipe.inputBuffer.putSamples(staging, 0, RENDER_QUANTUM)
      pipe.process()

      const toExtract = Math.min(pipe.outputBuffer.frameCount, RENDER_QUANTUM)
      if (toExtract > 0) {
        pipe.outputBuffer.extract(extracted, 0, toExtract)
        pipe.outputBuffer.receive(toExtract)
        for (let i = 0; i < toExtract; i++) out[offset + i] = extracted[i * 2]
      }
    }

    for (let at = LATENCY_FRAMES + FFT_SIZE; at < input.length - 1024; at += 1024) {
      expect(rms(out, at, at + 1024)).toBeGreaterThan(0.05)
    }
  })

  it('starts silent rather than bursting', () => {
    const out = render(sine(440, SR), sine(440, SR), 4)

    expect(rms(out.l, 0, RENDER_QUANTUM * 3)).toBe(0)
    expect(rms(out.l, LATENCY_FRAMES, LATENCY_FRAMES + 1024)).toBeGreaterThan(0.1)
  })

  it('handles a silent input without producing anything', () => {
    const silence = new Float32Array(SR)

    expect(rms(render(silence, silence, 5).l)).toBe(0)
  })
})
