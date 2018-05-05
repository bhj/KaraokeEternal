import PropTypes from 'prop-types'
import React from 'react'
import ColorCycle from './ColorCycle'
import UpNow from './UpNow'
import Fire from './Fire'
import './PlayerTextOverlay.css'

class PlayerTextOverlay extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (this.props.queueItem !== nextProps.queueItem) {
      return true
    }

    if (this.props.isAtQueueEnd !== nextProps.isAtQueueEnd) {
      return true
    }

    if (this.props.isErrored !== nextProps.isErrored) {
      return true
    }

    if (this.props.width !== nextProps.width || this.props.height !== nextProps.height) {
      return true
    }

    return false
  }

  render () {
    const { width, height } = this.props
    let Component

    if (this.props.queueItem.queueId === -1) {
      Component = <ColorCycle text='PRESS PLAY TO BEGIN' />
    } else if (this.props.isAtQueueEnd) {
      Component = <ColorCycle text='CAN HAZ MOAR SONGZ?' />
    } else if (this.props.isErrored) {
      Component = <Fire text='CRAP' />
    } else {
      Component = <UpNow text={this.props.queueItem.username} />
    }

    return (
      <div style={{ width, height }} styleName='container'>
        {Component}
      </div>
    )
  }
}

export default PlayerTextOverlay
