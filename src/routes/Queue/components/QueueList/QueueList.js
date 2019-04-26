import PropTypes from 'prop-types'
import React from 'react'
import QueueItem from '../QueueItem'
import { formatSeconds } from 'lib/dateTime'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import styles from './QueueList.css'
const QUEUE_ITEM_HEIGHT = 92

class QueueList extends React.Component {
  static propTypes = {
    curId: PropTypes.number,
    curPos: PropTypes.number,
    errorMessage: PropTypes.string.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    playerHistory: PropTypes.array.isRequired,
    queue: PropTypes.object.isRequired,
    starredSongs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    waits: PropTypes.object.isRequired,
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    removeItem: PropTypes.func.isRequired,
    showSongInfo: PropTypes.func.isRequired,
    showErrorMessage: PropTypes.func.isRequired,
    toggleSongStarred: PropTypes.func.isRequired,
  }

  containerRef = React.createRef()

  componentDidMount () {
    // ensure current song is visible
    if (this.containerRef.current) {
      const i = this.props.queue.result.indexOf(this.props.curId)
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

      const isActive = (queueId === props.curId) && !props.isAtQueueEnd
      const isUpcoming = queueId !== props.curId && !props.playerHistory.includes(queueId)
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
            errorMessage={isActive && props.errorMessage ? props.errorMessage : ''}
            isActive={isActive}
            isErrored={isActive && props.isErrored}
            isInfoable={props.user.isAdmin}
            isOwner={isOwner}
            isPlayed={!isUpcoming && !isActive}
            isRemovable={isUpcoming && (isOwner || props.user.isAdmin)}
            isSkippable={isActive && (isOwner || props.user.isAdmin)}
            isStarred={props.starredSongs.includes(item.songId)}
            isUpcoming={isUpcoming}
            pctPlayed={isActive ? props.curPos / item.duration * 100 : 0}
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
