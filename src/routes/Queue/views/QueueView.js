import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router'
import Header from 'components/Header'
import QueueList from '../components/QueueList'
import QueueTextOverlay from '../components/QueueTextOverlay'

const QueueView = (props) => {
  return (
    <>
      <Header />

      {!props.isInRoom &&
        <QueueTextOverlay ui={props.ui}>
          <h1>Get a Room!</h1>
          <p><Link to='/account'>Sign in to a room</Link> to start queueing songs.</p>
        </QueueTextOverlay>
      }

      {props.isQueueEmpty &&
        <QueueTextOverlay ui={props.ui}>
          <h1>Queue Empty</h1>
          <p>Tap a song in the <Link to='/library'>library</Link> to queue it.</p>
        </QueueTextOverlay>
      }

      <QueueList {...props} />
    </>
  )
}

QueueView.propTypes = {
  ui: PropTypes.object.isRequired,
  isInRoom: PropTypes.bool.isRequired,
  isQueueEmpty: PropTypes.bool.isRequired,
}

export default QueueView
