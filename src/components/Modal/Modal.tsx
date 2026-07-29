import React, { useLayoutEffect, useRef } from 'react'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import styles from './Modal.css'

export type ModalProps = {
  buttons?: React.ReactNode
  className?: string
  children?: React.ReactNode
  /* styles the heading row, which contains the title/headingComponent and the close button */
  headingClassName?: string
  onClose: () => void
  scrollable?: boolean
  visible?: boolean
} & (
  | { 'title': string, 'headingComponent'?: never, 'aria-label'?: string }
  | { 'title'?: never, 'headingComponent': React.ReactElement, 'aria-label': string }
)

const Modal = ({ 'aria-label': ariaLabel, buttons, className, children, headingClassName, headingComponent, visible = true, onClose, scrollable, title }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isOutsideClick = useRef(false)

  useLayoutEffect(() => {
    const dialog = dialogRef.current

    if (visible && dialog) {
      dialog.showModal()
      // close() while still in the DOM so the browser restores focus to the opener
      return () => dialog.close()
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
      aria-label={ariaLabel ?? title}
      className={clsx(styles.container, className)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onCancel={handleCancel}
    >
      <div className={clsx(styles.titleContainer, headingClassName)}>
        {headingComponent ?? <h1>{title}</h1>}
        <Button icon='CLEAR' className={styles.btnClose} onClick={onClose} aria-label='Close' />
      </div>
      <div className={clsx(styles.content, scrollable && styles.scrollable)}>{children}</div>
      {buttons && <div className={styles.buttons}>{buttons}</div>}
    </dialog>
  )
}

export default Modal
