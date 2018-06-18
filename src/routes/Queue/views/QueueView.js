import PropTypes from 'prop-types'
import React from 'react'
import QueueList from '../components/QueueList'
import NoRoom from '../components/NoRoom'

const QueueView = (props) => {
  const View = props.user.roomId ? QueueList : NoRoom

  return (
    <View {...props} />
  )
}

QueueView.propTypes = {
  ui: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
}

export default QueueView
