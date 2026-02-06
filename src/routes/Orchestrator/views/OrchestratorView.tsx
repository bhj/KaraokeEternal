import React, { useCallback, useEffect, useRef, useState } from 'react'
import combinedReducer from 'store/reducers'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { VISUALIZER_HYDRA_CODE_REQ } from 'shared/actionTypes'
import playerVisualizerReducer from 'routes/Player/modules/playerVisualizer'
import { sliceInjectNoOp } from 'routes/Player/modules/player'
import { DEFAULT_SKETCH, getRandomSketch } from '../components/hydraSketchBook'
import { getEffectiveCode, getPendingRemote, normalizeCodeForAck, resolvePreviewHydraState, shouldAutoApplyPreset } from './orchestratorViewHelpers'
import ApiReference from '../components/ApiReference'
import PresetBrowser from '../components/PresetBrowser'
import CodeEditor from '../components/CodeEditor'
import StagePanel from '../components/StagePanel'
import { type StageBuffer } from '../components/stagePanelUtils'
import { useCameraSender } from 'lib/webrtc/useCameraSender'
import { getPreviewSize } from './orchestratorLayout'
import styles from './OrchestratorView.css'

function OrchestratorView () {
  const dispatch = useAppDispatch()
  const camera = useCameraSender()
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
  const previewHydraState = resolvePreviewHydraState(hasUpdate, playerVisualizer, status.visualizer)

  const ui = useAppSelector(state => state.ui)
  const containerRef = useRef<HTMLDivElement>(null)
  const [localCode, setLocalCode] = useState<string>(DEFAULT_SKETCH)
  const [previewBuffer, setPreviewBuffer] = useState<StageBuffer>('auto')
  const [userHasEdited, setUserHasEdited] = useState(false)
  const [pendingRemoteCode, setPendingRemoteCode] = useState<string | null>(null)
  const [pendingRemoteCount, setPendingRemoteCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'presets' | 'api'>('presets')
  const [activeMobileTab, setActiveMobileTab] = useState<'stage' | 'code' | 'ref'>('stage')
  const [debouncedCode, setDebouncedCode] = useState<string>(DEFAULT_SKETCH)
  const [refPanelWidth, setRefPanelWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 280
    const stored = window.localStorage.getItem('orchestratorRefPanelWidth')
    const width = stored ? Number(stored) : NaN
    if (!Number.isFinite(width)) return 280
    return Math.min(520, Math.max(240, width))
  })
  const [isResizingPanel, setIsResizingPanel] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'synced' | 'error'>('idle')
  const prevRemoteRef = useRef<string | undefined>(undefined)
  const prevPresetIndexRef = useRef<number | undefined>(undefined)
  const lastSentRef = useRef<string | null>(null)

  const handleSendCode = useCallback((code: string) => {
    lastSentRef.current = normalizeCodeForAck(code)
    setSendStatus('sending')
    dispatch({
      type: VISUALIZER_HYDRA_CODE_REQ,
      payload: { code },
    })
  }, [dispatch])

  const handleCodeChange = useCallback((code: string) => {
    setUserHasEdited(true)
    setLocalCode(code)
    if (sendStatus === 'synced' || sendStatus === 'error') {
      setSendStatus('idle')
      lastSentRef.current = null
    }
  }, [sendStatus])

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

  const handleCameraToggle = useCallback(async () => {
    if (camera.status === 'idle' || camera.status === 'error') {
      await camera.start()
    } else {
      camera.stop()
    }
  }, [camera])

  const handleLoadPreset = useCallback((code: string) => {
    setLocalCode(code)
    setUserHasEdited(true)
    if (ui.innerWidth < 980) {
      setActiveMobileTab('stage')
    }
  }, [ui.innerWidth])

  const handleSendPreset = useCallback((code: string) => {
    setLocalCode(code)
    setUserHasEdited(true)
    handleSendCode(code)
    if (ui.innerWidth < 980) {
      setActiveMobileTab('stage')
    }
  }, [handleSendCode, ui.innerWidth])

  const handleResend = useCallback(() => {
    handleSendCode(localCode)
  }, [handleSendCode, localCode])

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

  // Persist ref panel width
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('orchestratorRefPanelWidth', String(refPanelWidth))
  }, [refPanelWidth])

  // Handle ref panel resize drag
  useEffect(() => {
    if (!isResizingPanel) return
    const handleMove = (event: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const next = Math.min(520, Math.max(240, event.clientX - rect.left))
      setRefPanelWidth(next)
    }
    const handleUp = () => {
      setIsResizingPanel(false)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingPanel])

  // Sync remote code to local (audioized) before user edits — runs once per remote change
  useEffect(() => {
    if (userHasEdited) return
    if (!remoteHydraCode || remoteHydraCode.trim() === '') return
    if (remoteHydraCode === localCode) return
    const id = requestAnimationFrame(() => {
      setLocalCode(remoteHydraCode)
    })
    return () => cancelAnimationFrame(id)
  }, [remoteHydraCode, userHasEdited, localCode])

  // Mark send status as synced when remote matches last sent code
  useEffect(() => {
    if (!lastSentRef.current || !remoteHydraCode) return
    const normalizedRemote = normalizeCodeForAck(remoteHydraCode)
    if (!normalizedRemote || normalizedRemote !== lastSentRef.current) return
    let timeoutId: number | null = null
    const rafId = requestAnimationFrame(() => {
      setSendStatus('synced')
      lastSentRef.current = null
      timeoutId = window.setTimeout(() => setSendStatus('idle'), 1500)
    })
    return () => {
      cancelAnimationFrame(rafId)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [remoteHydraCode])

  // If no ack arrives, show error
  useEffect(() => {
    if (sendStatus !== 'sending') return
    const id = window.setTimeout(() => {
      if (sendStatus === 'sending') setSendStatus('error')
    }, 4000)
    return () => window.clearTimeout(id)
  }, [sendStatus])

  // Track remote code changes — uses async callback to satisfy lint
  useEffect(() => {
    if (remoteHydraCode === prevRemoteRef.current) return
    prevRemoteRef.current = remoteHydraCode

    if (!userHasEdited) return

    const pending = getPendingRemote(remoteHydraCode ?? null, localCode, userHasEdited)
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
      setLocalCode(remoteHydraCode!)
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
  const isMobile = ui.innerWidth < 980
  const isRefOpen = isMobile && activeMobileTab === 'ref'
  const refPanelClass = isRefOpen
    ? `${styles.refPanel} ${styles.refPanelOpen}`
    : styles.refPanel
  let tabContent: React.ReactNode
  if (activeTab === 'presets') {
    tabContent = (
      <PresetBrowser
        currentCode={localCode}
        onLoad={handleLoadPreset}
        onSend={handleSendPreset}
      />
    )
  } else {
    tabContent = <ApiReference />
  }

  const containerStyle = { ['--ref-panel-width' as string]: `${refPanelWidth}px` } as React.CSSProperties

  return (
    <div
      className={`${styles.container} ${isResizingPanel ? styles.containerResizing : ''}`}
      ref={containerRef}
      style={containerStyle}
    >
      <div className={refPanelClass}>
        <div className={styles.tabBar}>
          <button
            type='button'
            className={`${styles.tab} ${activeTab === 'presets' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Presets
          </button>
          <button
            type='button'
            className={`${styles.tab} ${activeTab === 'api' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('api')}
          >
            API
          </button>
        </div>
        <div className={styles.tabContent}>
          {tabContent}
        </div>
        {!isMobile && (
          <div
            className={styles.refPanelResize}
            onPointerDown={() => setIsResizingPanel(true)}
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize presets panel'
            tabIndex={-1}
          />
        )}
      </div>
      {isMobile && activeMobileTab === 'ref' && (
        <div
          className={styles.refPanelOverlay}
          onClick={() => setActiveMobileTab('stage')}
          role='presentation'
        />
      )}
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
      {(!isMobile || activeMobileTab === 'stage') && (
        <div className={styles.stageDock}>
          <StagePanel
            code={effectiveCode}
            width={previewSize.width}
            height={previewSize.height}
            buffer={previewBuffer}
            onBufferChange={setPreviewBuffer}
            localCameraStream={camera.stream}
            onPresetLoad={handleLoadPreset}
            onPresetSend={handleSendPreset}
            onRandomize={handleRandomize}
            visualizerMode={previewHydraState.mode}
            visualizerEnabled={previewHydraState.isEnabled}
            visualizerSensitivity={previewHydraState.sensitivity}
            visualizerAllowCamera={previewHydraState.allowCamera}
            visualizerAudioResponse={previewHydraState.audioResponse}
          />
        </div>
      )}
      {(!isMobile || activeMobileTab === 'code') && (
        <div className={styles.codeDock}>
          <CodeEditor
            code={userHasEdited ? localCode : effectiveCode}
            onCodeChange={handleCodeChange}
            onSend={handleSendCode}
            sendStatus={sendStatus}
            onResend={handleResend}
            onRandomize={handleRandomize}
            cameraStatus={camera.status}
            onCameraToggle={handleCameraToggle}
          />
        </div>
      )}

      {isMobile && (
        <div className={styles.mobileToolbar}>
          <button
            type='button'
            className={`${styles.mobileTab} ${activeMobileTab === 'stage' ? styles.mobileTabActive : ''}`}
            onClick={() => setActiveMobileTab('stage')}
          >
            <span className={styles.mobileTabIcon}>{'\u25b6'}</span>
            <span>Stage</span>
          </button>
          <button
            type='button'
            className={`${styles.mobileTab} ${activeMobileTab === 'code' ? styles.mobileTabActive : ''}`}
            onClick={() => setActiveMobileTab('code')}
          >
            <span className={styles.mobileTabIcon}>{'\u003c\u002f\u003e'}</span>
            <span>Code</span>
          </button>
          <button
            type='button'
            className={`${styles.mobileTab} ${activeMobileTab === 'ref' ? styles.mobileTabActive : ''}`}
            onClick={() => setActiveMobileTab('ref')}
          >
            <span className={styles.mobileTabIcon}>{'\u2630'}</span>
            <span>Presets</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default OrchestratorView
