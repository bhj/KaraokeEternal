import React, { useCallback, useRef, useState } from 'react'
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
  const previewRef = useRef<HTMLDivElement>(null)

  const handleSendCode = useCallback((code: string) => {
    setPreviewCode(code)
    dispatch({
      type: VISUALIZER_HYDRA_CODE_REQ,
      payload: { code },
    })
  }, [dispatch])

  const handlePatchChange = useCallback((code: string) => {
    setGeneratedCode(code)
    handleSendCode(code)
  }, [handleSendCode])

  return (
    <div className={styles.container}>
      <div className={styles.editorPanel}>
        <div className={styles.patchBayArea}>
          <PatchBay onCodeChange={handlePatchChange} />
        </div>
        <div className={styles.editorArea}>
          <CodeEditor
            onSend={handleSendCode}
            generatedCode={generatedCode}
          />
        </div>
      </div>
      <div className={styles.previewPanel} ref={previewRef}>
        <HydraPreview
          code={previewCode}
          width={640}
          height={480}
        />
      </div>
    </div>
  )
}

export default OrchestratorView
