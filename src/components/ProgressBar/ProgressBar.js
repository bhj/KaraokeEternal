import PropTypes from 'prop-types'
import React from 'react'
import './ProgressBar.css'

export default class ProgressBar extends React.Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    onCancel: PropTypes.func.isRequired,
  }

  state = {
    isCanceling: false,
  }

  handleCancelClick = () => {
    this.setState({ isCanceling: true })
    this.props.onCancel()
  }

  render () {
    const { state, props } = this

    return (
      <div styleName='container' style={{ backgroundSize: props.progress + '% 100%' }}>
        <p styleName='text'>{state.isCanceling ? 'Canceling...' : props.text}</p>
        <div onClick={this.handleCancelClick}>
          <i className='material-icons' styleName='cancel'>clear</i>
        </div>
      </div>
    )
  }
}
