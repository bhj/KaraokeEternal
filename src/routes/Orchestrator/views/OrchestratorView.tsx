import React, { useCallback, useState } from 'react'
import { useAppDispatch } from 'store/hooks'
import { VISUALIZER_HYDRA_CODE_REQ } from 'shared/actionTypes'
import CodeEditor from '../components/CodeEditor'
import PatchBay from '../components/PatchBay'
import HydraPreview from '../components/HydraPreview'
import styles from './OrchestratorView.css'

function OrchestratorView () {
  const dispatch = useAppDispatch()
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