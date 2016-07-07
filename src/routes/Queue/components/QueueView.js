import React, { PropTypes } from 'react'
import Header from 'components/Header'
import QueueItem from './QueueItem'
import classes from './QueueView.css'

class QueueView extends React.Component {
  static propTypes = {
    queueIds: PropTypes.array.isRequired,
    uids: PropTypes.array.isRequired,
    items: PropTypes.object.isRequired,
    errorMessage: PropTypes.string,
    // library
    artistIds: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired,
    songUIDs: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    // user
    user: PropTypes.object.isRequired,
    //player
    isPlaying: PropTypes.bool.isRequired,
    currentId: PropTypes.number,
    currentTime: PropTypes.number,
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

      return (
        <QueueItem
          key={queueId}
          artist={this.props.artists[song.artistId].name}
          title={song.title}
          userName={item.userName}
          isOwner={item.userId === this.props.user.id}
          isPlaying={this.props.currentId === queueId}
          onRemoveClick={this.handleRemoveClick.bind(this, queueId)}
          onSkipClick={this.props.requestPlayNext}
        />
      )
    }, this)

    return (
      <div className={classes.flexContainer}>
        <div className={classes.header}>
          <h1>Queue</h1>
          {!this.props.isPlaying &&
            <button onClick={this.props.requestPlay}>Play</button>
          }
          {this.props.isPlaying &&
            <button onClick={this.props.requestPause}>Pause</button>
          }
        </div>

        {this.props.errorMessage &&
          <p>{this.props.errorMessage}</p>
        }

        <div className={classes.scrollable}>
          {songs}
        </div>
      </div>
    )
  }

  handleRemoveClick(id) {
    this.props.removeItem(id)
  }

  handleSkipClick() {
    this.props.requestPlayNext()
  }
}

export default QueueView
