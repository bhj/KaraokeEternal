import PropTypes from 'prop-types'
import React from 'react'
import ColorCycle from './ColorCycle'
import UpNow from './UpNow'
import styles from './PlayerTextOverlay.css'

const PlayerTextOverlay = ({
  isQueueEmpty,
  isAtQueueEnd,
  isErrored,
  nextQueueItem,
  queueItem,
  width,
  height,
}) => {
  let Component

  if (isQueueEmpty || (isAtQueueEnd && !nextQueueItem)) {
    Component = <ColorCycle text='CAN HAZ MOAR SONGZ?' className={styles.backdrop}/>
  } else if (!queueItem || (isAtQueueEnd && nextQueueItem)) {
    Component = <ColorCycle text='PRESS PLAY TO BEGIN' className={styles.backdrop}/>
  } else if (isErrored) {
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

PlayerTextOverlay.propTypes = {
  queueItem: PropTypes.object,
  nextQueueItem: PropTypes.object,
  isAtQueueEnd: PropTypes.bool.isRequired,
  isQueueEmpty: PropTypes.bool.isRequired,
  isErrored: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
}

export default React.memo(PlayerTextOverlay)
