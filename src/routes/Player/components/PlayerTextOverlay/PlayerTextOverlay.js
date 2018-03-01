import PropTypes from 'prop-types'
import React from 'react'
import Fire from './Fire'
import UpNow from './UpNow'
import './PlayerTextOverlay.css'

const Components = {
  Fire,
  UpNow,
}

class PlayerTextOverlay extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }

  state = {
    component: null,
    text: '',
  }

  shouldComponentUpdate (nextProps, nextState) {
    return this.shouldUpdate === true
  }

  upNow (name) {
    this.shouldUpdate = true

    this.setState({
      component: 'UpNow',
      text: `Up now: ${name}`,
    }, () => { this.shouldUpdate = false })
  }

  error () {
    this.shouldUpdate = true
    this.setState({
      component: 'Fire',
      text: 'CRAP',
    })
  }

  render () {
    if (this.state.component === null) return null

    const { width, height } = this.props
    const Component = Components[this.state.component]

    return (
      <div style={{ width, height }} styleName='container'>
        <Component text={this.state.text} />
      </div>

    )
  }
}

export default PlayerTextOverlay
