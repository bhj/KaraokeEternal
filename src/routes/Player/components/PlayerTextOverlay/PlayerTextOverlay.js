import PropTypes from 'prop-types'
import React from 'react'
// import ColorCycle from '../ColorCycle'
import { CSSTransition } from 'react-transition-group'
import styles from './PlayerTextOverlay.css'

class PlayerTextOverlay extends React.Component {
  static propTypes = {
    style: PropTypes.object.isRequired,
  }

  timeoutID = null
  state = {
    show: false,
  }

  upNext (name) {
    clearTimeout(this.timeoutID)
    this.timeoutID = setTimeout(() => {
      this.setState({ show: false })
    }, 2000)

    this.setState({
      show: true,
      text: `Up now: ${name}`,
    })
  }

  render () {
    return (
      <div style={this.props.style} styleName='styles.container'>
        <CSSTransition
          in={this.state.show}
          timeout={10000}
          classNames={{
            appear: '',
            appearActive: '',
            enter: styles.fadeEnter,
            enterActive: styles.fadeEnterActive,
            exit: styles.fadeExit,
            exitActive: styles.fadeExitActive,
          }}>
          <div className='bg-blur' styleName='styles.textContainer'>
            {this.state.text}
          </div>
        </CSSTransition>
      </div>

    )
  }
}

export default PlayerTextOverlay
