import PropTypes from 'prop-types'
import React from 'react'
import { Modal } from 'react-responsive-modal'
import styles from './Modal.css'

const CustomModal = (props) => {
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

CustomModal.propTypes = {
  buttons: PropTypes.any,
  children: PropTypes.any,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  style: PropTypes.object,
  title: PropTypes.string.isRequired,
}

export default React.memo(CustomModal)
