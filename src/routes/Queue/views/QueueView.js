import PropTypes from 'prop-types'
import React from 'react'
import { useSelector } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { Link } from 'react-router-dom'
import QueueList from '../components/QueueList'
import Spinner from 'components/Spinner'
import TextOverlay from 'components/TextOverlay'
import styles from './QueueView.css'

const QueueView = (props) => {
  React.useLayoutEffect(() => props.setHeader(null))

  const { innerWidth, innerHeight, headerHeight, footerHeight } = useSelector(state => state.ui)
  const isInRoom = useSelector(state => !!state.user.roomId)
  const queue = useSelector(state => ensureState(state.queue))

  return (
    <div className={styles.container} style={{
      paddingTop: headerHeight,
      paddingBottom: footerHeight,
      width: innerWidth,
      height: innerHeight,
    }}>
      {!isInRoom &&
        <TextOverlay>
          <h1>Get a Room!</h1>
          <p><Link to='/account'>Sign in to a room</Link> to start queueing songs.</p>
        </TextOverlay>
      }

      {queue.isLoading &&
        <Spinner />
      }

      {!queue.isLoading && queue.result.length === 0 &&
        <TextOverlay>
          <h1>Queue Empty</h1>
          <p>Tap a song in the <Link to='/library'>library</Link> to queue it.</p>
        </TextOverlay>
      }

      <QueueList />
    </div>
  )
}

QueueView.propTypes = {
  setHeader: PropTypes.func.isRequired,
}

export default QueueView
