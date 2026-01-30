import React, { useCallback, useEffect, useState } from 'react'
import combinedReducer from 'store/reducers'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { VISUALIZER_HYDRA_CODE_REQ } from 'shared/actionTypes'
import playerVisualizerReducer from 'routes/Player/modules/playerVisualizer'
import { sliceInjectNoOp } from 'routes/Player/modules/player'
import { shouldApplyRemoteCode } from '../components/orchestratorSync'
import CodeEditor from '../components/CodeEditor'
import PatchBay from '../components/PatchBay'
import HydraPreview from '../components/HydraPreview'
import styles from './OrchestratorView.css'

function OrchestratorView () {
  const dispatch = useAppDispatch()
  const playerVisualizer = useAppSelector(state => state.playerVisualizer)
  const remoteHydraCode = playerVisualizer?.hydraCode
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [previewCode, setPreviewCode] = useState<string>('')

  const handleSendCode = useCallback((code: string) => {
    dispatch({
      type: VISUALIZER_HYDRA_CODE_REQ,
      payload: { code },
    })
  }, [dispatch])

  const handlePatchChange = useCallback((code: string) => {
    setGeneratedCode(code)
    setPreviewCode(code) // Update preview immediately
    handleSendCode(code) // Auto-broadcast (optional)
  }, [handleSendCode])

  if (!playerVisualizer) {
    combinedReducer.inject({ reducerPath: 'playerVisualizer', reducer: playerVisualizerReducer })
    dispatch(sliceInjectNoOp())
  }

  useEffect(() => {
    if (shouldApplyRemoteCode(generatedCode, remoteHydraCode)) {
      setGeneratedCode(remoteHydraCode ?? '')
      setPreviewCode(remoteHydraCode ?? '')
    }
  }, [generatedCode, remoteHydraCode])

  return (
    <div className={styles.container}>
      <div className={styles.patchBayArea}>
        <PatchBay onCodeChange={handlePatchChange} />
      </div>
      <div className={styles.sidebar}>
        <div className={styles.previewArea}>
          <HydraPreview
            code={previewCode}
            width={380}
            height={285}
          />
        </div>
        <div className={styles.editorArea}>
          <CodeEditor
            onSend={handleSendCode}
            generatedCode={generatedCode}
          />
        </div>
      </div>
    </div>
  )
}

export default OrchestratorView
