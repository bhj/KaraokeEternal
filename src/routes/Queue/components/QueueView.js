import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
import QueueItem from './QueueItem'

class QueueView extends React.Component {
  static propTypes = {
    result: PropTypes.array.isRequired,
    entities: PropTypes.object.isRequired,
    errors: PropTypes.object,
    curId: PropTypes.number,
    curPos: PropTypes.number,
    isAtQueueEnd: PropTypes.bool.isRequired,
    // library
    artistIds: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired,
    songIds: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    // user
    user: PropTypes.object.isRequired,
    // actions
    requestPlay: PropTypes.func.isRequired,
    requestPlayNext: PropTypes.func.isRequired,
    requestPause: PropTypes.func.isRequired,
  }

  render() {
    let songs = []
    let wait = 0
    let nextWait = 0

    songs = this.props.result.map(function(queueId, i) {
      const { curId, curPos } = this.props

      const item = this.props.entities[queueId]
      const song = this.props.songs[item.songId]
      const isActive = (item.queueId === curId) && !this.props.isAtQueueEnd
      const isUpcoming = queueId > curId
      const isOwner = item.userId === this.props.user.userId
      const isAdmin = this.props.user.isAdmin === 1

      // hand time-to-play to the next queue item
      if (isActive) {
        nextWait = Math.round(song.duration - curPos)
      } else if (isUpcoming) {
        wait += nextWait
        nextWait = song.duration
      }

      return (
        <QueueItem
          key={queueId+'-'+item.userId}
          artist={this.props.artists[song.artistId].name}
          title={song.title}
          name={item.name}
          isActive={isActive}
          isUpcoming={isUpcoming}
          wait={isUpcoming && wait ? secToTime(wait) : ''}
          canSkip={isActive && isOwner}
          canRemove={isUpcoming && isOwner}
          hasErrors={typeof this.props.errors[queueId] !== 'undefined'}
          pctPlayed={isActive ? curPos / song.duration * 100 : 0}
          onRemoveClick={this.handleRemoveClick.bind(this, queueId)}
          onSkipClick={this.props.requestPlayNext}
          onErrorInfoClick={this.handleErrorInfoClick.bind(this, queueId)}
        />
      )
    }, this)

    return (
      <AppLayout title="Queue">
        {songs}
      </AppLayout>
    )
  }

  handleRemoveClick(queueId) {
    this.props.removeItem(queueId)
  }

  handleErrorInfoClick(queueId) {
    alert(this.props.errors[queueId].join("\n\n"))
  }
}

export default QueueView

function secToTime(sec) {
  if (sec >= 60) {
    return Math.round(sec/60) + 'm'
  } else {
    return Math.floor(sec) + 's'
  }
}

// function getTime(sec) {
//   const date = new Date()
//   if (sec) date.setSeconds(date.getSeconds() + sec)
//   return date.toTimeString().split(' ')[0]
// }

// function toMinSec(sec) {
//   const m = Math.floor(sec / 60)
//   const s = sec - (m * 60)
//   return (m + ':' + (s < 10 ? '0' + s : s))
// }
