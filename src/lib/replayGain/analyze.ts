import { measureReplayGain } from './measure'

/**
 * decodeAudioData always resamples to the decode context's rate, and there's
 * no way to learn a file's native rate without parsing its container, so the
 * rate is a choice. 48kHz because upsampling 44.1 slightly over-reports sample
 * peak (inter-sample overshoot), which is the safe direction for the player's
 * clip-safe clamp; downsampling would filter peaks away and under-report.
 */
const ANALYSIS_SAMPLE_RATE = 48000

// analyses that failed for reasons that won't change until the page reloads
const failed = new Set<number>()

// survives a reload so an OOM tab kill doesn't become a crash loop
const CRASH_KEY = 'ke.replayGain.attempting'

let decodeCtx: OfflineAudioContext | null = null

// decodes can't be aborted, so never allow more than one to stack up
let isAnalyzing = false

export const hasFailed = (mediaId: number) => failed.has(mediaId)

export const isAnalysisInFlight = () => isAnalyzing

// An analysis still marked in-progress means the tab died decoding it, most
// likely out of memory. Don't try that file again, or reloading the player
// just crashes it again.
try {
  const crashed = parseInt(sessionStorage.getItem(CRASH_KEY), 10)

  if (Number.isInteger(crashed)) {
    failed.add(crashed)
    sessionStorage.removeItem(CRASH_KEY)
    console.warn('[ReplayGain] mediaId %s was mid-analysis when the player last closed '
      + '(likely out of memory); it will play without gain for this session', crashed)
  }
} catch {
  // sessionStorage throws in some private browsing modes; the guard is a
  // nicety, not a requirement
}

function setAttempting (mediaId: number | null) {
  try {
    if (mediaId === null) sessionStorage.removeItem(CRASH_KEY)
    else sessionStorage.setItem(CRASH_KEY, String(mediaId))
  } catch {
    // as above
  }
}

/**
 * Calculate ReplayGain values by decoding with the browser's own codecs, which
 * are by definition the same ones playback will use.
 *
 * Rejects when the media can't be decoded or measured; callers must fall back
 * to playing without gain. Marks the mediaId failed so it isn't retried.
 */
export async function analyzeBlob (
  mediaId: number,
  blob: Blob,
): Promise<{ rgTrackGain: number, rgTrackPeak: number }> {
  if (isAnalyzing) throw new Error('an analysis is already in progress')

  // a never-started offline context is reusable indefinitely, and unlike an
  // AudioContext it doesn't count against the browser's hardware context limit
  decodeCtx ??= new OfflineAudioContext(1, 1, ANALYSIS_SAMPLE_RATE)

  isAnalyzing = true
  setAttempting(mediaId)

  // the start line is the only evidence left if the tab dies decoding
  console.info('[ReplayGain] mediaId %s: analyzing %sMB of %s',
    mediaId, (blob.size / 1e6).toFixed(1), blob.type || 'unknown type')

  const startedAt = performance.now()

  try {
    // detaches the ArrayBuffer, so the blob must already exist
    let buffer: AudioBuffer = await decodeCtx.decodeAudioData(await blob.arrayBuffer())

    // getChannelData hands back live references, so this doesn't copy the PCM
    const channels: Float32Array[] = []
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    // read before the buffer is released
    const channelCount = buffer.numberOfChannels
    const duration = buffer.duration

    const measured = measureReplayGain(channels, buffer.sampleRate)

    // release the decoded PCM before doing anything else with the result
    channels.length = 0
    buffer = null

    if (measured === null) {
      throw new Error('no measurable audio')
    }

    const { rgTrackGain, rgTrackPeak, lufs } = measured
    const elapsed = (performance.now() - startedAt) / 1000

    // the realtime multiple is what tells you whether this machine can keep up
    console.info('[ReplayGain] mediaId %s: %s LUFS, gain %sdB, peak %s (%sch, %ss audio in %ss, %sx realtime)',
      mediaId, lufs.toFixed(2), rgTrackGain.toFixed(2), rgTrackPeak.toFixed(4),
      channelCount, duration.toFixed(0), elapsed.toFixed(1), (duration / elapsed).toFixed(0))

    return { rgTrackGain, rgTrackPeak }
  } catch (err) {
    failed.add(mediaId)
    throw err
  } finally {
    setAttempting(null)
    isAnalyzing = false
  }
}
