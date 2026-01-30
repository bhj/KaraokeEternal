import React, { useCallback, useEffect, useRef, useState } from 'react'
import combinedReducer from 'store/reducers'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { VISUALIZER_HYDRA_CODE_REQ } from 'shared/actionTypes'
import playerVisualizerReducer from 'routes/Player/modules/playerVisualizer'
import { sliceInjectNoOp } from 'routes/Player/modules/player'
import { DEFAULT_SKETCH, getRandomSketch } from '../components/hydraSketchBook'
import { getEffectiveCode, getPendingRemote } from './orchestratorViewHelpers'
import ApiReference from '../components/ApiReference'
import CodeEditor from '../components/CodeEditor'
import StagePanel from '../components/StagePanel'
import { type StageBuffer } from '../components/stagePanelUtils'
import { getPreviewSize } from './orchestratorLayout'
import styles from './OrchestratorView.css'

function OrchestratorView () {
  const dispatch = useAppDispatch()
  const playerVisualizer = useAppSelector(state => state.playerVisualizer)
  const remoteHydraCode = playerVisualizer?.hydraCode
  const ui = useAppSelector(state => state.ui)
  const [localCode, setLocalCode] = useState<string>(DEFAULT_SKETCH)
  const [previewBuffer, setPreviewBuffer] = useState<StageBuffer>('auto')
  const [userHasEdited, setUserHasEdited] = useState(false)
  const [pendingRemoteCode, setPendingRemoteCode] = useState<string | null>(null)
  const [pendingRemoteCount, setPendingRemoteCount] = useState(0)
  const [debouncedCode, setDebouncedCode] = useState<string>(DEFAULT_SKETCH)
  const prevRemoteRef = useRef<string | undefined>(undefined)

  const handleSendCode = useCallback((code: string) => {
    dispatch({
      type: VISUALIZER_HYDRA_CODE_REQ,
      payload: { code },
    })
  }, [dispatch])

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

  const handleApplyRemote = useCallback(() => {
    if (pendingRemoteCode) {
      setLocalCode(pendingRemoteCode)
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

  // Track remote code changes — uses async callback to satisfy lint
  useEffect(() => {
    if (remoteHydraCode === prevRemoteRef.current) return
    prevRemoteRef.current = remoteHydraCode

    if (!userHasEdited) return

    const pending = getPendingRemote(remoteHydraCode, localCode, userHasEdited)
    if (pending === null) return

    // Schedule state update asynchronously (external system sync pattern)
    const id = requestAnimationFrame(() => {
      setPendingRemoteCode(pending)
      setPendingRemoteCount(c => c + 1)
    })
    return () => cancelAnimationFrame(id)
  }, [remoteHydraCode, localCode, userHasEdited])

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
        />
      </div>
    </div>
  )
}

export default OrchestratorView
