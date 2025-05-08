import React, { useEffect, useRef, useCallback } from 'react'
import clsx from 'clsx'
import styles from './Modal.css'

export type ModalProps = {
  buttons?: React.ReactNode
  className?: string
  children?: React.ReactNode
  visible?: boolean
  onClose: () => void
  title: string
}

const Modal = ({ buttons, className, children, visible = true, onClose, title }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isOutsideClick = useRef(false)

  useEffect(() => {
    if (visible && dialogRef.current) {
      dialogRef.current.showModal()
    }
  }, [visible])

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDialogElement>) => {
    isOutsideClick.current = event.target === dialogRef.current
  }, [])

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLDialogElement>) => {
    if (isOutsideClick.current && event.target === dialogRef.current) {
      onClose()
    }
    isOutsideClick.current = false
  }, [onClose])

  const handleCancel = useCallback((e) => {
    e.preventDefault()
    onClose()
  }, [onClose])

  if (!visible) return null

  return (
    <dialog
      ref={dialogRef}
      className={clsx(styles.container, className)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onCancel={handleCancel}
    >
      <div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.content}>{children}</div>
        {buttons && <div className={styles.buttons}>{buttons}</div>}
      </div>
    </dialog>
  )
}

export default Modal
