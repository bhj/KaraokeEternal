import React, { useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (visible && dialogRef.current) {
      dialogRef.current.showModal()
    }
  }, [visible])

  const handleOutsideClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onClose()
    }
  }

  if (!visible) return null

  return (
    <dialog
      ref={dialogRef}
      className={clsx(styles.container, className)}
      onClick={handleOutsideClick}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div>
        <h1 className={styles.title}>
          {title}
        </h1>
        <div className={styles.content}>
          {children}
        </div>
        {buttons && (
          <div className={styles.buttons}>
            {buttons}
          </div>
        )}
      </div>
    </dialog>
  )
}

export default Modal
