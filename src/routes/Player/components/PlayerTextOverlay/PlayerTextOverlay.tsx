import React from 'react'
import ColorCycle from './ColorCycle/ColorCycle'
import UpNow from './UpNow/UpNow'
import type { QueueItem } from 'shared/types'
import styles from './PlayerTextOverlay.css'

interface PlayerTextOverlayProps {
  queueItem?: QueueItem
  nextQueueItem?: QueueItem
  isAtQueueEnd: boolean
  isQueueEmpty: boolean
  isErrored: boolean
  width: number
  height: number
}

const PlayerTextOverlay = ({
  isQueueEmpty,
  isAtQueueEnd,
  isErrored,
  nextQueueItem,
  queueItem,
  width,
  height,
}: PlayerTextOverlayProps) => {
  let Component

  if (isQueueEmpty || (isAtQueueEnd && !nextQueueItem)) {
    Component = <ColorCycle text='CAN HAZ MOAR SONGZ?' className={styles.backdrop} />
  } else if (!queueItem || (isAtQueueEnd && nextQueueItem)) {
    Component = <ColorCycle text='PRESS PLAY TO BEGIN' className={styles.backdrop} />
  } else if (isErrored) {
    const offset = Math.random() * -300
    Component = (
      <>
        <ColorCycle text='OOPS...' offset={offset} className={styles.backdrop} />
        <ColorCycle text='SEE QUEUE FOR DETAILS' offset={offset} className={styles.backdrop} />
      </>
    )
  } else {
    Component = <UpNow queueItem={queueItem} />
  }

  return (
    <div style={{ width, height }} className={styles.container}>
      {Component}
    </div>
  )
}

export default React.memo(PlayerTextOverlay)
