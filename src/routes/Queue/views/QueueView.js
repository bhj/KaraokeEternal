import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router'
import Header from 'components/Header'
import QueueList from '../components/QueueList'
import Spinner from 'components/Spinner'
import TextOverlay from 'components/TextOverlay'
import './QueueView.css'

const QueueView = (props) => (
  <div styleName='container' style={{
    paddingTop: props.headerHeight,
    paddingBottom: props.footerHeight,
    width: props.browserWidth,
    height: props.browserHeight,
  }}>
    <Header />

    {!props.isInRoom &&
      <TextOverlay>
        <h1>Get a Room!</h1>
        <p><Link to='/account'>Sign in to a room</Link> to start queueing songs.</p>
      </TextOverlay>
    }

    {props.isLoading &&
      <Spinner />
    }

    {!props.isLoading && props.isQueueEmpty &&
      <TextOverlay>
        <h1>Queue Empty</h1>
        <p>Tap a song in the <Link to='/library'>library</Link> to queue it</p>
      </TextOverlay>
    }

    <QueueList />
  </div>
)

QueueView.propTypes = {
  isInRoom: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isQueueEmpty: PropTypes.bool.isRequired,
  // ui
  browserWidth: PropTypes.number.isRequired,
  browserHeight: PropTypes.number.isRequired,
  headerHeight: PropTypes.number.isRequired,
  footerHeight: PropTypes.number.isRequired,
}

export default QueueView
