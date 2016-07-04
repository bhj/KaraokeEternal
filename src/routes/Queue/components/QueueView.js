import React, { PropTypes } from 'react'
import Header from 'components/Header'
import QueueItem from './QueueItem'
import styles from './QueueView.css'

class QueueView extends React.Component {
  static propTypes = {
    // queue data
    queueIds: PropTypes.array.isRequired,
    uids: PropTypes.array.isRequired,
    items: PropTypes.object.isRequired,
    errorMessage: PropTypes.string,
    // library data
    artistIds: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired,
    songUIDs: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    // user data
    user: PropTypes.object.isRequired,
    removeItem: PropTypes.func.isRequired,
  }

  render() {
    if (!this.props.artistIds.length) return null

    let songs = this.props.queueIds.map(function(queueId, i) {
      let item = this.props.items[queueId]
      let song = this.props.songs[item.uid]

      return (
        <QueueItem
          key={queueId}
          artist={this.props.artists[song.artistId].name}
          title={song.title}
          userName={item.userName}
          canDelete={item.userId === this.props.user.id}
          onRemoveClick={this.handleRemoveClick.bind(this, queueId)}
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

  handleRemoveClick(id) {
    this.props.removeItem(id)
  }
}

export default QueueView
