import React, { useCallback, useEffect, useRef, useState } from 'react'
import combinedReducer from 'store/reducers'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { VISUALIZER_HYDRA_CODE_REQ } from 'shared/actionTypes'
import playerVisualizerReducer from 'routes/Player/modules/playerVisualizer'
import { sliceInjectNoOp } from 'routes/Player/modules/player'
import { audioizeHydraCode } from 'routes/Player/components/Player/PlayerVisualizer/hooks/audioizeHydraCode'
import { DEFAULT_SKETCH, getRandomSketch } from '../components/hydraSketchBook'
import { getEffectiveCode, getPendingRemote, shouldAutoApplyPreset } from './orchestratorViewHelpers'
import ApiReference from '../components/ApiReference'
import CodeEditor from '../components/CodeEditor'
import StagePanel from '../components/StagePanel'
import { type StageBuffer } from '../components/stagePanelUtils'
import { getPreviewSize } from './orchestratorLayout'
import styles from './OrchestratorView.css'

function OrchestratorView () {
  const dispatch = useAppDispatch()
  const playerVisualizer = useAppSelector(state => state.playerVisualizer)
  const status = useAppSelector(state => state.status)

  // playerVisualizer starts with hasHydraUpdate=false.
  // Once a VISUALIZER_HYDRA_CODE action arrives, flag is set to true.
  // Until then, fall back to status.visualizer (hydrated by PLAYER_STATUS).
  const hasUpdate = playerVisualizer?.hasHydraUpdate === true
  const remoteHydraCode = hasUpdate
    ? playerVisualizer.hydraCode
    : status.visualizer?.hydraCode
  const remotePresetIndex = hasUpdate
    ? playerVisualizer.hydraPresetIndex
    : status.visualizer?.hydraPresetIndex

  const ui = useAppSelector(state => state.ui)
  const [localCode, setLocalCode] = useState<string>(DEFAULT_SKETCH)
  const [previewBuffer, setPreviewBuffer] = useState<StageBuffer>('auto')
  const [userHasEdited, setUserHasEdited] = useState(false)
  const [pendingRemoteCode, setPendingRemoteCode] = useState<string | null>(null)
  const [pendingRemoteCount, setPendingRemoteCount] = useState(0)
  const [autoAudioOnSend, setAutoAudioOnSend] = useState(false)
  const [debouncedCode, setDebouncedCode] = useState<string>(DEFAULT_SKETCH)
  const prevRemoteRef = useRef<string | undefined>(undefined)
  const prevPresetIndexRef = useRef<number | undefined>(undefined)

  const handleSendCode = useCallback((code: string) => {
    const finalCode = autoAudioOnSend ? audioizeHydraCode(code) : code
    dispatch({
      type: VISUALIZER_HYDRA_CODE_REQ,
      payload: { code: finalCode },
    })
  }, [dispatch, autoAudioOnSend])

  const handleCodeChange = useCallback((code: string) => {
    setUserHasEdited(true)
    setLocalCode(code)
  }, [])

  /**
   * Random is LOCAL-ONLY: changes the editor code but does NOT dispatch to
   * the server. The user must explicitly Send (Ctrl+Enter) to share with
   * other clients. This avoids spamming collaborators with rapid clicks.
   */
  const handleRandomize = useCallback(() => {
    const sketch = getRandomSketch()
    setLocalCode(sketch)
    setUserHasEdited(true)
  }, [])

  const handleAutoAudio = useCallback(() => {
    const audioized = audioizeHydraCode(localCode)
    if (audioized !== localCode) {
      setLocalCode(audioized)
      setUserHasEdited(true)
    }
  }, [localCode])

  const handleToggleAutoAudio = useCallback(() => {
    setAutoAudioOnSend(prev => !prev)
  }, [])

  const handleApplyRemote = useCallback(() => {
    if (pendingRemoteCode) {
      setLocalCode(audioizeHydraCode(pendingRemoteCode))
    }
    setPendingRemoteCode(null)
    setPendingRemoteCount(0)
  }, [pendingRemoteCode])

  const handleDismissRemote = useCallback(() => {
    setPendingRemoteCode(null)
    setPendingRemoteCount(0)
  }, [])

  if (!playerVisualizer) {
    combinedReducer.inject({ reducerPath: 'playerVisualizer', reducer: playerVisualizerReducer })
    dispatch(sliceInjectNoOp())
  }

  // Sync remote code to local (audioized) before user edits — runs once per remote change
  useEffect(() => {
    if (userHasEdited) return
    if (!remoteHydraCode || remoteHydraCode.trim() === '') return
    const audioized = audioizeHydraCode(remoteHydraCode)
    if (audioized === localCode) return
    const id = requestAnimationFrame(() => {
      setLocalCode(audioized)
    })
    return () => cancelAnimationFrame(id)
  }, [remoteHydraCode, userHasEdited, localCode])

  // Track remote code changes — uses async callback to satisfy lint
  useEffect(() => {
    if (remoteHydraCode === prevRemoteRef.current) return
    prevRemoteRef.current = remoteHydraCode

    if (!userHasEdited) return

    // Audioize both sides before comparison so injection-only diffs don't trigger banner
    const normalizedRemote = remoteHydraCode ? audioizeHydraCode(remoteHydraCode) : null
    const normalizedLocal = audioizeHydraCode(localCode)
    const pending = getPendingRemote(normalizedRemote, normalizedLocal, userHasEdited)
    if (pending === null) return

    // Schedule state update asynchronously (external system sync pattern)
    const id = requestAnimationFrame(() => {
      setPendingRemoteCode(pending)
      setPendingRemoteCount(c => c + 1)
    })
    return () => cancelAnimationFrame(id)
  }, [remoteHydraCode, localCode, userHasEdited])

  // Auto-apply when player navigates presets (index changes)
  useEffect(() => {
    const prevIdx = prevPresetIndexRef.current
    prevPresetIndexRef.current = remotePresetIndex

    if (!shouldAutoApplyPreset(prevIdx, remotePresetIndex, userHasEdited, remoteHydraCode)) return

    const id = requestAnimationFrame(() => {
      setLocalCode(audioizeHydraCode(remoteHydraCode!))
      setUserHasEdited(false)
      setPendingRemoteCode(null)
      setPendingRemoteCount(0)
    })
    return () => cancelAnimationFrame(id)
  }, [remotePresetIndex, remoteHydraCode, userHasEdited])

  // Debounce preview at 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(localCode)
    }, 150)
    return () => clearTimeout(timer)
  }, [localCode])

  const effectiveCode = getEffectiveCode(
    userHasEdited ? debouncedCode : localCode,
    remoteHydraCode,
    userHasEdited,
  )

  const previewSize = getPreviewSize(ui.innerWidth)

  return (
    <div className={styles.container}>
      <div className={styles.refPanel}>
        <ApiReference />
      </div>
      {pendingRemoteCode && (
        <div className={styles.remoteBanner}>
          <span className={styles.remoteBannerText}>
            {`Remote update available${pendingRemoteCount > 1 ? ` (\u00d7${pendingRemoteCount})` : ''}`}
          </span>
          <button type='button' className={styles.remoteBannerApply} onClick={handleApplyRemote}>
            Apply
          </button>
          <button type='button' className={styles.remoteBannerDismiss} onClick={handleDismissRemote}>
            Dismiss
          </button>
        </div>
      )}
      <div className={styles.stageDock}>
        <StagePanel
          code={effectiveCode}
          width={previewSize.width}
          height={previewSize.height}
          buffer={previewBuffer}
          onBufferChange={setPreviewBuffer}
        />
      </div>
      <div className={styles.codeDock}>
        <CodeEditor
          code={userHasEdited ? localCode : effectiveCode}
          onCodeChange={handleCodeChange}
          onSend={handleSendCode}
          onRandomize={handleRandomize}
          onAutoAudio={handleAutoAudio}
          autoAudioOnSend={autoAudioOnSend}
          onToggleAutoAudio={handleToggleAutoAudio}
        />
      </div>
    </div>
  )
}

export default OrchestratorView
