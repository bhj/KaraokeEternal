import React from 'react'
import { Modal as ResponsiveModal, ModalProps as ResponsiveModalProps } from 'react-responsive-modal'
import styles from './Modal.css'

export interface ModalProps {
  buttons?: React.ReactNode
  children?: React.ReactNode
  isVisible: boolean
  onClose: ResponsiveModalProps['onClose']
  style?: object
  title: string
}

const Modal = (props: ModalProps) => {
  // disabling blockScroll for now due to
  // https://github.com/pradel/react-responsive-modal/issues/468
  return (
    <ResponsiveModal
      blockScroll={false}
      animationDuration={167}
      open={props.isVisible}
      onClose={props.onClose}
      closeOnEsc
      closeOnOverlayClick
      classNames={{
        root: styles.modalRoot,
        overlay: styles.modalOverlay,
        modal: styles.modal,
        modalContainer: styles.modalContainer,
        closeButton: styles.modalCloseButton,
      }}
      styles={{
        modal: {
          ...props.style,
        }
      }}
    >
      <div className={styles.container}>
        <h1 className={styles.title}>
          {props.title}
        </h1>

        <div className={styles.content}>
          {props.children}
        </div>

        {props.buttons &&
          <div className={styles.buttons}>
            {props.buttons}
          </div>
        }
      </div>
    </ResponsiveModal>
  )
}

export default React.memo(Modal)
