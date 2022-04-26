import React from 'react'
import PropTypes from 'prop-types'
import Slider from 'rc-slider'
import { lockScrolling } from 'store/modules/ui'
// depends on styles/global/rc-slider

export default class OptimisticSlider extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    handle: PropTypes.func.isRequired, // custom handle render prop
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    step: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  }

  state = {
    val: this.props.value,
    isDragging: false,
    isStable: true,
  }

  timerId = null

  componentDidUpdate (prevProps) {
    if (!this.state.isStable && this.state.val === this.props.value) {
      clearTimeout(this.timerId)
      this.setState({ isStable: true })
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (!nextState.isDragging && !nextState.isStable && nextProps.value !== nextState.val) {
      return false
    }

    return true
  }

  render () {
    return (
      <Slider
        className={this.props.className}
        handleRender={this.props.handle}
        max={this.props.max}
        min={this.props.min}
        onAfterChange={this.handleAfterChange}
        onBeforeChange={this.handleBeforeChange}
        onChange={this.handleChange}
        step={this.props.step}
        value={this.state.isDragging ? this.state.val : this.props.value}
      />
    )
  }

  handleChange = val => {
    this.setState({ val }, () => {
      this.props.onChange(val)
    })
  }

  handleBeforeChange = () => {
    lockScrolling(true)
    clearTimeout(this.timerId)
    this.setState({ isDragging: true })
  }

  handleAfterChange = val => {
    lockScrolling(false)

    this.setState({
      isStable: val === this.props.value,
      isDragging: false,
    })

    // revert to the prop after a time since there could be value changes from outside
    if (val !== this.props.value) {
      this.timerId = setTimeout(() => this.setState({ val: this.props.value }), 2000)
    }
  }
}
