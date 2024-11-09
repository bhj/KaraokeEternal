import React from 'react'
import Slider, { SliderProps } from 'rc-slider'
import { lockScrolling } from 'store/modules/ui'

interface OptimisticSliderProps {
  className?: string
  handle: SliderProps['handleRender'] // custom handle render prop;
  min: number
  max: number
  onChange: SliderProps['onChange']
  step: number
  value: number
}

// depends on styles/global/rc-slider

export default class OptimisticSlider extends React.Component<OptimisticSliderProps> {
  state = {
    val: this.props.value,
    isDragging: false,
    isStable: true,
  }

  timerId = null

  componentDidUpdate () {
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
        onChangeComplete={this.handleAfterChange}
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
