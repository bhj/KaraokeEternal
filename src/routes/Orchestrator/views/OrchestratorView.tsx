import React, { useCallback, useState } from 'react'
import combinedReducer from 'store/reducers'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { VISUALIZER_HYDRA_CODE_REQ } from 'shared/actionTypes'
import playerVisualizerReducer from 'routes/Player/modules/playerVisualizer'
import { sliceInjectNoOp } from 'routes/Player/modules/player'
import { shouldApplyRemoteCode } from '../components/orchestratorSync'
import CodeEditor from '../components/CodeEditor'
import PatchBay from '../components/PatchBay'
import StagePanel from '../components/StagePanel'
import { type StageBuffer } from '../components/stagePanelUtils'
import styles from './OrchestratorView.css'

function OrchestratorView () {
  const dispatch = useAppDispatch()
  const playerVisualizer = useAppSelector(state => state.playerVisualizer)
  const remoteHydraCode = playerVisualizer?.hydraCode
  const [localCode, setLocalCode] = useState<string>('')
  const [previewBuffer, setPreviewBuffer] = useState<StageBuffer>('o0')

  const handleSendCode = useCallback((code: string) => {
    dispatch({
      type: VISUALIZER_HYDRA_CODE_REQ,
      payload: { code },
    })
  }, [dispatch])

  const handlePatchChange = useCallback((code: string) => {
    setLocalCode(code)
    handleSendCode(code) // Auto-broadcast (optional)
  }, [handleSendCode])

  if (!playerVisualizer) {
    combinedReducer.inject({ reducerPath: 'playerVisualizer', reducer: playerVisualizerReducer })
    dispatch(sliceInjectNoOp())
  }

  const shouldUseRemote = localCode.trim() === ''
    && shouldApplyRemoteCode(localCode, remoteHydraCode)
  const effectiveCode = shouldUseRemote ? (remoteHydraCode ?? '') : localCode

  const previewWidth = 360
  const previewHeight = 270

  return (
    <div className={styles.container}>
      <div className={styles.patchBayArea}>
        <PatchBay onCodeChange={handlePatchChange} />
      </div>
      <div className={styles.sidebar}>
        <StagePanel
          code={effectiveCode}
          width={previewWidth}
          height={previewHeight}
          buffer={previewBuffer}
          onBufferChange={setPreviewBuffer}
        />
        <div className={styles.editorArea}>
          <CodeEditor
            onSend={handleSendCode}
            generatedCode={effectiveCode}
          />
        </div>
      </div>
    </div>
  )
}

export default OrchestratorView
