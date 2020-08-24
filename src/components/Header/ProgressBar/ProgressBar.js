import PropTypes from 'prop-types'
import React from 'react'
import './ProgressBar.css'
import Icon from 'components/Icon'

export default class ProgressBar extends React.Component {
  static propTypes = {
    isActive: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    pct: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
  }

  state = {
    isCanceling: false,
    isVisible: false,
  }

  handleCancelClick = () => {
    if (this.props.isActive && !this.state.isCanceling) {
      this.setState({ isCanceling: true })
      this.props.onCancel()
    } else {
      this.setState({ isVisible: false })
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.isActive && !prevProps.isActive) {
      this.setState({ isVisible: true, isCanceling: false })
    } else if (this.state.isCanceling && this.props.text !== prevProps.text) {
      // only show 'Stopping...' until the next update
      this.setState({ isCanceling: false })
    }
  }

  render () {
    const { state, props } = this
    if (!state.isVisible) return null

    return (
      <div styleName='container' style={{ backgroundSize: props.pct + '% 100%' }}>
        <p styleName='text'>{state.isCanceling ? 'Stopping...' : props.text}</p>
        <div styleName='cancel' onClick={this.handleCancelClick}>
          <Icon icon='CLEAR' size={40} styleName='cancelIcon' />
        </div>
      </div>
    )
  }
}
