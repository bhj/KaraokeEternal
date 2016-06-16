import React, { PropTypes } from 'react'
import Header from 'components/Header'
import QueueItem from './QueueItem'
import styles from './QueueView.css'

class QueueView extends React.Component {
  static propTypes = {
    // queue data
    queuedIds: PropTypes.array.isRequired,
    queuedItems: PropTypes.object.isRequired,
    errorMessage: PropTypes.string,
    // library data
    artistIds: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired,
    songUIDs: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    // user data
    user: PropTypes.object.isRequired,
  }

  render() {
    if (!this.props.artistIds.length) return null

    let songs = this.props.queuedIds.map(function(qId, i) {
      let qItem = this.props.queuedItems[qId]
      let song = this.props.songs[qItem.songUID]

      return (
        <QueueItem
          key={qId}
          artist={this.props.artists[song.artistId].name}
          title={song.title}
          userName={qItem.userName}
          canDelete={qItem.userId === this.props.user.id}
          onDeleteClick={() => this.handleDeleteClick(qId)}
        />
      )
    }, this)

    return (
      <div className={styles.flexContainer}>
        <Header title="Queue"/>

        {this.props.errorMessage &&
          <p>{this.props.errorMessage}</p>
        }

        <div className={styles.scrollable}>
          {songs}
        </div>
      </div>
    )
  }

  handleDeleteClick(id) {
    this.props.deleteItem(id)
  }
}

export default QueueView
