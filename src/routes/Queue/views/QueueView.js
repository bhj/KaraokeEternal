import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import QueueList from '../components/QueueList'
import NoRoom from '../components/NoRoom'

const QueueView = (props) => {
  const View = props.user.roomId ? QueueList : NoRoom

  return (
    <div>
      <Header />
      <View {...props} />
    </div>
  )
}

QueueView.propTypes = {
  ui: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
}

export default QueueView
