import React from 'react'
import { Modal, ModalProps } from 'react-responsive-modal'
import styles from './Modal.css'

interface CustomModalProps {
  buttons?: React.ReactNode
  children?: React.ReactNode
  isVisible: boolean
  onClose: ModalProps['onClose']
  style?: object
  title: string
}

const CustomModal = (props: CustomModalProps) => {
  // disabling blockScroll for now due to
  // https://github.com/pradel/react-responsive-modal/issues/468
  return (
    <Modal
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
    </Modal>
  )
}

export default React.memo(CustomModal)
