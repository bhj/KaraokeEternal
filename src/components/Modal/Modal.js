import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { Modal } from 'react-responsive-modal'
import styles from './Modal.css'

const CustomModal = (props) => {
  const ui = useSelector(state => state.ui)

  return (
    <Modal
      animationDuration={167}
      open={props.isVisible}
      onClose={props.onClose}
      closeOnEsc
      closeOnOverlayClick
      classNames={{
        overlay: styles.overlay,
        modal: styles.modal,
        closeButton: styles.closeButton,
      }}
      styles={{
        modal: {
          maxWidth: ui.contentWidth * 0.85,
          maxHeight: ui.innerHeight * 0.9,
          ...props.style,
        }
      }}
    >
      <div styleName='styles.container'>
        <h1 styleName='styles.title'>
          {props.title}
        </h1>
        <div styleName='styles.content'>
          {props.children}
        </div>

        {props.buttons &&
          <div styleName='styles.buttons'>
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

export default CustomModal
