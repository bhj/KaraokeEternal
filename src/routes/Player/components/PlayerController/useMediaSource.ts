import { useEffect, useRef, useState } from 'react'
import { createAction } from '@reduxjs/toolkit'
import HttpApi from 'lib/HttpApi'
import { analyzeBlob, hasFailed, isAnalysisInFlight } from 'lib/replayGain/analyze'
import { useAppDispatch } from 'store/hooks'
import { MEDIA_RG_SET } from 'shared/actionTypes'
import { playerLoadCurrent } from '../../modules/player'

const api = new HttpApi('media')

// giving up here just means playing without gain, so it can be generous
const ANALYSIS_TIMEOUT = 60000

const setReplayGain = createAction<{
  mediaId: number
  rgTrackGain: number
  rgTrackPeak: number
}>(MEDIA_RG_SET)

const queryFor = (mediaType: string) => `?type=${mediaType === 'mp4' ? 'video' : 'audio'}`
const urlFor = (mediaId: number, mediaType: string) =>
  `${document.baseURI}api/media/${mediaId}${queryFor(mediaType)}`

const secsSince = (started: number) => (performance.now() - started) / 1000

function withTimeout<T> (promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>

  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('timed out')), ms)
    }),
  ]).finally(() => clearTimeout(timer))
}

interface UseMediaSourceProps {
  mediaId: number | null
  mediaType: string | null
  rgTrackGain: number | null
  rgTrackPeak: number | null
  isReplayGainEnabled: boolean
}

/**
 * Resolves the URL the player element should load.
 *
 * Media that already has ReplayGain values (the overwhelming majority) resolves
 * to the plain API URL in the same render, keeping the browser's progressive
 * streaming. Media without values is downloaded in full first so it can be
 * decoded and measured with the browser's own codecs, then played back from
 * those same bytes rather than fetching them twice.
 *
 * Any failure along the way falls back to playing the song without gain; it's
 * never a reason not to play.
 */
export default function useMediaSource ({
  mediaId,
  mediaType,
  rgTrackGain,
  rgTrackPeak,
  isReplayGainEnabled,
}: UseMediaSourceProps) {
  const dispatch = useAppDispatch()
  const generation = useRef(0)

  const [resolved, setResolved] = useState<{
    mediaId: number | null
    src: string | null
    gain: number | null
    peak: number | null
    needsAnalysis: boolean
  }>({ mediaId: null, src: null, gain: null, peak: null, needsAnalysis: false })

  // Latch the decision once per mediaId. Queue pushes replace queue entities
  // wholesale, so re-deriving this would flip src mid-song and restart
  // playback -- including from the push our own report triggers.
  if (resolved.mediaId !== mediaId) {
    const needsAnalysis = isReplayGainEnabled
      && mediaId !== null
      && (rgTrackGain === null || rgTrackPeak === null)
      && !hasFailed(mediaId)

    setResolved({
      mediaId,
      src: mediaId === null || needsAnalysis ? null : urlFor(mediaId, mediaType),
      gain: null,
      peak: null,
      needsAnalysis,
    })
  }

  const { needsAnalysis } = resolved

  useEffect(() => {
    if (!needsAnalysis) return

    const gen = ++generation.current
    const ctrl = new AbortController()
    let objectUrl: string | null = null

    // ignore anything that finishes after we've moved on to another song
    const resolve = (src: string, gain: number | null = null, peak: number | null = null) => {
      if (generation.current !== gen) return
      setResolved(prev => prev.mediaId === mediaId ? { ...prev, src, gain, peak } : prev)
    }

    const run = async () => {
      // nothing else covers the download+decode window
      dispatch(playerLoadCurrent())

      // decoding can't be aborted, so don't stack decodes when the player is
      // skipped through several songs; this one just plays without gain
      if (isAnalysisInFlight()) {
        console.warn('[ReplayGain] mediaId %s: another analysis is still running; playing without gain', mediaId)
        return resolve(urlFor(mediaId, mediaType))
      }

      let blob: Blob
      const startedAt = performance.now()

      // playback is held for as long as this takes, so say so before the wait
      // rather than after it; the analysis lines only appear once it's over
      console.info('[ReplayGain] mediaId %s: no stored values, downloading in full before playback', mediaId)

      try {
        const res = await api.get<Response>(`/${mediaId}${queryFor(mediaType)}`, { signal: ctrl.signal })
        blob = await res.blob()
      } catch (err) {
        // transient (network, auth, aborted); leave it eligible to retry later
        if (ctrl.signal.aborted) {
          console.info('[ReplayGain] mediaId %s: download abandoned after %ss; player moved on',
            mediaId, secsSince(startedAt).toFixed(1))
        } else {
          console.warn('[ReplayGain] mediaId %s: download failed after %ss (%s); streaming without gain',
            mediaId, secsSince(startedAt).toFixed(1), err.message)
          resolve(urlFor(mediaId, mediaType))
        }
        return
      }

      const megabytes = blob.size / 1e6
      const elapsed = secsSince(startedAt)

      console.info('[ReplayGain] mediaId %s: downloaded %sMB in %ss (%sMB/s)',
        mediaId, megabytes.toFixed(1), elapsed.toFixed(1),
        (megabytes / Math.max(elapsed, 0.001)).toFixed(1))

      objectUrl = URL.createObjectURL(blob)

      if (ctrl.signal.aborted) {
        console.info('[ReplayGain] mediaId %s: discarding the download; player moved on', mediaId)
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
        return
      }

      try {
        const { rgTrackGain, rgTrackPeak } = await withTimeout(analyzeBlob(mediaId, blob), ANALYSIS_TIMEOUT)

        // report even if we've been superseded: the values are still correct
        // for this mediaId, and re-deriving them isn't cheap
        dispatch(setReplayGain({ mediaId, rgTrackGain, rgTrackPeak }))
        resolve(objectUrl, rgTrackGain, rgTrackPeak)
      } catch (err) {
        // the bytes are already paid for, so play from them anyway
        console.warn('[ReplayGain] mediaId %s: analysis failed (%s); playing without gain', mediaId, err.message)
        resolve(objectUrl)
      }
    }

    run()

    return () => {
      ctrl.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [dispatch, mediaId, mediaType, needsAnalysis])

  const isCurrent = resolved.mediaId === mediaId

  return {
    mediaSrc: isCurrent ? resolved.src : null,
    // locally measured values win, and never leak into the next song
    rgTrackGain: isCurrent ? resolved.gain ?? rgTrackGain : null,
    rgTrackPeak: isCurrent ? resolved.peak ?? rgTrackPeak : null,
  }
}
