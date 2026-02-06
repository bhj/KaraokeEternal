import React, { useEffect, useRef } from 'react'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import styles from './Modal.css'

export type ModalProps = {
  buttons?: React.ReactNode
  className?: string
  children?: React.ReactNode
  onClose: () => void
  scrollable?: boolean
  title: string
  visible?: boolean
}

const Modal = ({ buttons, className, children, visible = true, onClose, scrollable, title }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isOutsideClick = useRef(false)

  useEffect(() => {
    if (visible && dialogRef.current) {
      dialogRef.current.showModal()
    }
  }, [visible])

  const handleMouseDown = (event: React.MouseEvent<HTMLDialogElement>) => {
    isOutsideClick.current = event.target === dialogRef.current
  }

  const handleMouseUp = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (isOutsideClick.current && event.target === dialogRef.current) {
      onClose()
    }
    isOutsideClick.current = false
  }

  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault()
    onClose()
  }

  if (!visible) return null

  return (
    <dialog
      ref={dialogRef}
      className={clsx(styles.container, className)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onCancel={handleCancel}
    >
      <div className={styles.titleContainer}>
        <h1>{title}</h1>
        <Button icon='CLEAR' className={styles.btnClose} onClick={onClose} aria-label='Close' />
      </div>
      <div className={clsx(styles.content, scrollable && styles.scrollable)}>{children}</div>
      {buttons && <div className={styles.buttons}>{buttons}</div>}
    </dialog>
  )
}

export default Modal
