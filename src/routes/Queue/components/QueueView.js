import React, { PropTypes } from 'react'
import { Header, HeaderTitle } from 'components/Header'
import Navigation from 'components/Navigation'
import QueueItem from './QueueItem'
import classes from './QueueView.css'

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
    if (!this.props.artistIds.length) {
      // library not loaded yet
      return null
    }

    let songs = this.props.result.map(function(queueId, i) {
      const item = this.props.entities[queueId]
      const song = this.props.songs[item.songId]
      const { curId, isFinished, errors } = this.props
      const isActive = (item.queueId === curId) && !isFinished
      const isOwner = item.userId === this.props.user.userId
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
          canSkip={isOwner && isActive}
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
      <div className={classes.flexContainer}>
        <Header>
          <HeaderTitle>Queue</HeaderTitle>
          {!this.props.isPlaying &&
            <div className={classes.button} onClick={this.props.requestPlay}>
              <i className={'material-icons '+classes.button}>play_arrow</i>
            </div>
          }
          {this.props.isPlaying &&
            <div className={classes.button} onClick={this.props.requestPause}>
              <i className={'material-icons '+classes.button}>pause</i>
            </div>
          }
        </Header>

        {this.props.errorMessage &&
          <p>{this.props.errorMessage}</p>
        }

        <div className={classes.scrollable}>
          {songs}
        </div>

        <Navigation />
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
