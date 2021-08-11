import PropTypes from 'prop-types'
import React from 'react'
import QueueItem from '../QueueItem'
import QueueYoutubeItem from '../QueueYoutubeItem'
import { formatSeconds } from 'lib/dateTime'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import styles from './QueueList.css'
const QUEUE_ITEM_HEIGHT = 92

class QueueList extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    errorMessage: PropTypes.string.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    playerHistory: PropTypes.array.isRequired,
    position: PropTypes.number,
    queue: PropTypes.object.isRequired,
    queueId: PropTypes.number,
    songs: PropTypes.object.isRequired,
    starredSongs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    waits: PropTypes.object.isRequired,
    // actions
    removeItem: PropTypes.func.isRequired,
    requestPlayNext: PropTypes.func.isRequired,
    showErrorMessage: PropTypes.func.isRequired,
    showSongInfo: PropTypes.func.isRequired,
    toggleSongStarred: PropTypes.func.isRequired,
  }

  containerRef = React.createRef()

  componentDidMount () {
    // ensure current song is visible
    if (this.containerRef.current) {
      const i = this.props.queue.result.indexOf(this.props.queueId)
      this.containerRef.current.parentNode.scrollTop = QUEUE_ITEM_HEIGHT * i
    }
  }

  render () {
    const props = this.props
    if (props.queue.result.length === 0) return null

    // build children array
    const items = props.queue.result.map(queueId => {
      const item = props.queue.entities[queueId]

      if (item.isOptimistic) return null

      if (item.youtubeVideoId) {
        if (!item.youtubeVideoStatus) return null

        const isCurrent = (queueId === props.queueId) && !props.isAtQueueEnd
        const isUpcoming = queueId !== props.queueId && !props.playerHistory.includes(queueId)
        const isOwner = item.userId === props.user.userId

        return (
          <CSSTransition
            key={queueId}
            timeout={800}
            unmountOnExit={false}
            classNames={{
              appear: '',
              appearActive: '',
              enter: styles.fadeEnter,
              enterActive: styles.fadeEnterActive,
              exit: styles.itemExit,
              exitActive: styles.itemExitActive,
            }}
          >
            <QueueYoutubeItem {...item}
              artist={item.youtubeVideoArtist}
              errorMessage={isCurrent && props.errorMessage ? props.errorMessage : ''}
              isCurrent={isCurrent}
              isErrored={isCurrent && props.isErrored}
              isOwner={isOwner}
              isPlayed={!isUpcoming && !isCurrent}
              isRemovable={isUpcoming && (isOwner || props.user.isAdmin)}
              isSkippable={isCurrent && (isOwner || props.user.isAdmin)}
              isUpcoming={isUpcoming}
              pctPlayed={isCurrent ? props.position / item.youtubeVideoDuration * 100 : 0}
              title={item.youtubeVideoTitle}
              wait={formatSeconds(props.waits[queueId], true)} // fuzzy
              status={item.youtubeVideoStatus}
              // actions
              onErrorInfoClick={props.showErrorMessage}
              onRemoveClick={props.removeItem}
              onSkipClick={props.requestPlayNext}
            />
          </CSSTransition>
        )
      }

      if (!props.songs.entities[item.songId] ||
          !props.artists.entities[props.songs.entities[item.songId].artistId]) return null

      const duration = props.songs.entities[item.songId].duration
      const isCurrent = (queueId === props.queueId) && !props.isAtQueueEnd
      const isUpcoming = queueId !== props.queueId && !props.playerHistory.includes(queueId)
      const isOwner = item.userId === props.user.userId

      return (
        <CSSTransition
          key={queueId}
          timeout={800}
          unmountOnExit={false}
          classNames={{
            appear: '',
            appearActive: '',
            enter: styles.fadeEnter,
            enterActive: styles.fadeEnterActive,
            exit: styles.itemExit,
            exitActive: styles.itemExitActive,
          }}
        >
          <QueueItem {...item}
            artist={props.artists.entities[props.songs.entities[item.songId].artistId].name}
            errorMessage={isCurrent && props.errorMessage ? props.errorMessage : ''}
            isCurrent={isCurrent}
            isErrored={isCurrent && props.isErrored}
            isInfoable={props.user.isAdmin}
            isOwner={isOwner}
            isPlayed={!isUpcoming && !isCurrent}
            isRemovable={isUpcoming && (isOwner || props.user.isAdmin)}
            isSkippable={isCurrent && (isOwner || props.user.isAdmin)}
            isStarred={props.starredSongs.includes(item.songId)}
            isUpcoming={isUpcoming}
            pctPlayed={isCurrent ? props.position / duration * 100 : 0}
            title={props.songs.entities[item.songId].title}
            wait={formatSeconds(props.waits[queueId], true)} // fuzzy
            // actions
            onErrorInfoClick={props.showErrorMessage}
            onInfoClick={props.showSongInfo}
            onRemoveClick={props.removeItem}
            onSkipClick={props.requestPlayNext}
            onStarClick={props.toggleSongStarred}
          />
        </CSSTransition>
      )
    })

    return (
      <div ref={this.containerRef}>
        <TransitionGroup component={null}>
          {items}
        </TransitionGroup>
      </div>
    )
  }
}

export default QueueList
