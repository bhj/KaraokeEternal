import PropTypes from 'prop-types'
import React from 'react'
import ColorCycle from './ColorCycle'
import UpNow from './UpNow'
import styles from './PlayerTextOverlay.css'

class PlayerTextOverlay extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isQueueEmpty: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }

  render () {
    const { queueItem, width, height } = this.props
    let Component

    if (this.props.isQueueEmpty || this.props.isAtQueueEnd) {
      Component = <ColorCycle text='CAN HAZ MOAR SONGZ?' className={styles.backdrop}/>
    } else if (!queueItem) {
      Component = <ColorCycle text='PRESS PLAY TO BEGIN' className={styles.backdrop}/>
    } else if (this.props.isErrored) {
      const offset = Math.random() * -300
      Component = <>
        <ColorCycle text='OOPS...' offset={offset} className={styles.backdrop}/>
        <ColorCycle text='SEE QUEUE FOR DETAILS' offset={offset} className={styles.backdrop}/>
      </>
    } else {
      Component = <UpNow queueItem={queueItem} />
    }

    return (
      <div style={{ width, height }} className={styles.container}>
        {Component}
      </div>
    )
  }
}

export default PlayerTextOverlay
