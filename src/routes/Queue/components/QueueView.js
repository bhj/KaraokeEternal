import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
import PaddedList from 'components/PaddedList'
import QueueItem from './QueueItem'

class QueueView extends React.Component {
  static propTypes = {
    queue: PropTypes.object.isRequired,
    artists: PropTypes.object.isRequired,
    songs: PropTypes.object.isRequired,
    errors: PropTypes.object,
    curId: PropTypes.number,
    curPos: PropTypes.number,
    isAtQueueEnd: PropTypes.bool.isRequired,
    user: PropTypes.object.isRequired,
    // actions
    requestPlay: PropTypes.func.isRequired,
    requestPlayNext: PropTypes.func.isRequired,
    requestPause: PropTypes.func.isRequired,
  }

  rowRenderer = this.rowRenderer.bind(this)
  rowHeight = this.rowHeight.bind(this)
  setRef = this.setRef.bind(this)

  componentDidUpdate(prevProps) {
    // nuclear option
    this.ref.recomputeRowHeights()
    this.ref.forceUpdate()
  }

  render() {
    // let wait = 0
    // let nextWait = 0

      // if (typeof song === 'undefined') return

      // hand time-to-play to the next queue item
      // if (isActive) {
      //   nextWait = Math.round(song.duration - curPos)
      // } else if (isUpcoming) {
      //   wait += nextWait
      //   nextWait = song.duration
      // }

    return (
      <AppLayout title="Queue">
        {(style) => (
          <PaddedList
            {...style}
            queuedSongIds={this.props.queuedSongIds} // pass-through forces List refresh
            rowCount={this.props.queue.result.length}
            rowHeight={this.rowHeight}
            rowRenderer={this.rowRenderer}
            onRef={this.setRef}
          />
        )}
      </AppLayout>
    )
  }

  rowRenderer({index, key, style}) {
    const item = this.props.queue.entities[this.props.queue.result[index]]
    const song = this.props.songs.entities[item.songId]
    const queueId = item.queueId

    const isActive = (queueId === this.props.curId) && !this.props.isAtQueueEnd
    const isUpcoming = queueId > this.props.curId
    const isOwner = item.userId === this.props.user.userId
    const isAdmin = this.props.user.isAdmin === 1

    return (
      <QueueItem
        key={key}
        style={style}
        artist={this.props.artists.entities[song.artistId].name}
        title={song.title}
        name={item.name}
        isActive={isActive}
        isUpcoming={isUpcoming}
        // wait={isUpcoming && wait ? secToTime(wait) : ''}
        canSkip={isActive && isOwner}
        canRemove={isUpcoming && isOwner}
        hasErrors={typeof this.props.errors[queueId] !== 'undefined'}
        pctPlayed={isActive ? curPos / song.duration * 100 : 0}
        onRemoveClick={this.handleRemoveClick.bind(this, queueId)}
        onSkipClick={this.props.requestPlayNext}
        onErrorInfoClick={this.handleErrorInfoClick.bind(this, queueId)}
      />
    )
  }

  rowHeight({index}) {
    return 64
  }

  handleRemoveClick(queueId) {
    this.props.removeItem(queueId)
  }

  handleErrorInfoClick(queueId) {
    alert(this.props.errors[queueId].join("\n\n"))
  }

  setRef(ref) {
    this.ref = ref
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
