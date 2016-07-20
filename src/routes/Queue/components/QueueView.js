import React, { PropTypes } from 'react'
import { Header, HeaderTitle } from 'components/Header'
import QueueItem from './QueueItem'
import classes from './QueueView.css'

class QueueView extends React.Component {
  static propTypes = {
    queueIds: PropTypes.array.isRequired,
    uids: PropTypes.array.isRequired,
    items: PropTypes.object.isRequired,
    errorMessage: PropTypes.string,
    errors: PropTypes.object.isRequired,
    // library
    artistIds: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired,
    songUIDs: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    // user
    user: PropTypes.object.isRequired,
    // player status
    isPlaying: PropTypes.bool.isRequired,
    currentId: PropTypes.number,
    currentTime: PropTypes.number,
    duration: PropTypes.number,
    // actions
    requestPlay: PropTypes.func.isRequired,
    requestPlayNext: PropTypes.func.isRequired,
    requestPause: PropTypes.func.isRequired,
  }

  handleSkipClick = this.handleSkipClick.bind(this)

  render() {
    if (!this.props.artistIds.length) return null

    let songs = this.props.queueIds.map(function(queueId, i) {
      const item = this.props.items[queueId]
      const song = this.props.songs[item.uid]
      const isOwner = item.userId === this.props.user.id
      const isPlaying = queueId === this.props.currentId
      const isErrored = typeof this.props.errors[queueId] !== 'undefined'

      return (
        <QueueItem
          key={queueId}
          artist={this.props.artists[song.artistId].name}
          title={song.title}
          userName={item.userName}
          canSkip={isOwner && isPlaying && !isErrored}
          canRemove={isOwner && !isPlaying && !isErrored && queueId > this.props.currentId}
          isErrored={isErrored}
          isLast={i === this.props.queueIds.length-1}
          isPlaying={isPlaying}
          pctPlayed={isPlaying ? this.props.currentTime / this.props.duration * 100 : 0}
          onRemoveClick={this.handleRemoveClick.bind(this, queueId)}
          onSkipClick={this.handleSkipClick}
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
      </div>
    )
  }

  handleRemoveClick(queueId) {
    this.props.removeItem(queueId)
  }

  handleErrorInfoClick(queueId) {
    alert(this.props.errors[queueId])
  }

  handleSkipClick() {
    this.props.requestPlayNext(this.props.currentId)
  }
}

export default QueueView
