import React, { PropTypes } from 'react'
import { Header, HeaderTitle } from 'components/Header'
import Navigation from 'components/Navigation'
import QueueItem from './QueueItem'

class QueueView extends React.Component {
  static propTypes = {
    result: PropTypes.array.isRequired,
    entities: PropTypes.object.isRequired,
    errors: PropTypes.object,
    curId: PropTypes.number,
    curPos: PropTypes.number,
    isPlaying: PropTypes.bool.isRequired,
    isFinished: PropTypes.bool.isRequired,
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

    songs = this.props.result.map(function(queueId, i) {
      const item = this.props.entities[queueId]
      const song = this.props.songs[item.songId]
      const { curId, isFinished, errors } = this.props
      const isActive = (item.queueId === curId) && !isFinished
      const isOwner = item.userId === this.props.user.userId
      const isAdmin = this.props.user.isAdmin === 1

      let timeLeft

      if (isActive) {
        const dur = Math.round(song.duration - this.props.curPos)
        const min = Math.floor(dur / 60)
        const sec = dur - (min * 60)
        timeLeft = min + ':' + (sec < 10 ? '0' + sec : sec)
        timeLeft = min || sec ? '-'+timeLeft : timeLeft
      }

      return (
        <QueueItem
          key={queueId}
          artist={this.props.artists[song.artistId].name}
          title={song.title}
          userName={item.userName}
          canSkip={isActive && (isOwner || isAdmin)}
          canRemove={isOwner && !isActive && queueId > curId}
          hasErrors={typeof errors[queueId] !== 'undefined'}
          pctPlayed={isActive ? this.props.curPos / song.duration * 100 : 0}
          timeLeft={timeLeft || ''}
          onRemoveClick={this.handleRemoveClick.bind(this, queueId)}
          onSkipClick={this.props.requestPlayNext}
          onErrorInfoClick={this.handleErrorInfoClick.bind(this, queueId)}
        />
      )
    }, this)

    return (
      <div style={{flex: '1'}}>
        {songs}
      </div>
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
