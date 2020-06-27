import React from 'react'
import PropTypes from 'prop-types'
import styles from './Modal.css'
import { Modal } from 'react-responsive-modal'

export default class CustomModal extends React.Component {
  static propTypes = {
    buttons: PropTypes.any,
    children: PropTypes.any,
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    style: PropTypes.object,
    title: PropTypes.string.isRequired,
    ui: PropTypes.object.isRequired,
  }

  render () {
    return (
      <Modal
        animationDuration={167}
        open={this.props.isVisible}
        onClose={this.props.onClose}
        closeOnEsc
        closeOnOverlayClick
        classNames={{
          overlay: styles.overlay,
          modal: styles.modal,
          closeButton: styles.closeButton,
        }}
        styles={{
          modal: {
            maxWidth: this.props.ui.contentWidth * 0.85,
            maxHeight: this.props.ui.innerHeight * 0.9,
            ...this.props.style,
          }
        }}
      >
        <div styleName='styles.container'>
          <h1 styleName='styles.title'>
            {this.props.title}
          </h1>
          <div styleName='styles.content'>
            {this.props.children}
          </div>

          {this.props.buttons &&
            <div styleName='styles.buttons'>
              {this.props.buttons}
            </div>
          }
        </div>
      </Modal>
    )
  }
}
