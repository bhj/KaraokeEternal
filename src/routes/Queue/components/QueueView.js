import React, { PropTypes } from 'react'
import { Header, HeaderTitle } from 'components/Header'
import QueueItem from './QueueItem'
import classes from './QueueView.css'

class QueueView extends React.Component {
  static propTypes = {
    result: PropTypes.array.isRequired,
    entities: PropTypes.object.isRequired,
    errors: PropTypes.object,
    status: PropTypes.object.isRequired,
    // library
    artistIds: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired,
    songUIDs: PropTypes.array.isRequired,
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

    const curId = this.props.status ? this.props.status.id : -1

    let songs = this.props.result.map(function(id, i) {
      const item = this.props.entities[id]
      const song = this.props.songs[item.uid]
      const isPlaying = item.id === curId
      const isErrored = typeof this.props.errors[id] !== 'undefined'
      const isOwner = item.userId === this.props.user.id

      return (
        <QueueItem
          key={id}
          artist={this.props.artists[song.artistId].name}
          title={song.title}
          userName={item.userName}
          canSkip={isOwner && isPlaying && !isErrored}
          canRemove={isOwner && !isPlaying && !isErrored && id > curId}
          isErrored={isErrored}
          isLast={i === this.props.result.length-1}
          isPlaying={isPlaying}
          pctPlayed={isPlaying ? this.props.currentTime / this.props.duration * 100 : 0}
          onRemoveClick={this.handleRemoveClick.bind(this, id)}
          onSkipClick={this.props.requestPlayNext}
          onErrorInfoClick={this.handleErrorInfoClick.bind(this, id)}
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

  handleRemoveClick(id) {
    this.props.removeItem(id)
  }

  handleErrorInfoClick(id) {
    alert(this.props.errors[id].join("\n\n"))
  }
}

export default QueueView
