import PropTypes from 'prop-types'
import React from 'react'
import QueueItem from '../QueueItem'
import { formatSecondsFuzzy } from 'lib/dateTime'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import styles from './QueueList.css'

const QUEUE_ITEM_HEIGHT = 80

class QueueList extends React.Component {
  static propTypes = {
    curId: PropTypes.number,
    curPos: PropTypes.number,
    errorMessage: PropTypes.string.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    queue: PropTypes.object.isRequired,
    starredSongs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    waits: PropTypes.object.isRequired,
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    removeItem: PropTypes.func.isRequired,
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
    const items = props.queue.result.map((queueId, index) => {
      const item = props.queue.entities[queueId]

      // @todo render placeholder for pending/optimistic items?
      if (item.isOptimistic) return null

      const isActive = (queueId === props.curId) && !props.isAtQueueEnd
      const isUpcoming = queueId > props.curId
      const isOwner = item.userId === props.user.userId
      const wait = formatSecondsFuzzy(props.waits[queueId])

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
            isOwner={isOwner}
            isRemovable={isUpcoming && (isOwner || props.user.isAdmin)}
            isSkippable={isActive && (isOwner || props.user.isAdmin)}
            isStarred={props.starredSongs.includes(item.songId)}
            isUpcoming={isUpcoming}
            pctPlayed={isActive ? props.curPos / item.duration * 100 : 0}
            waitUnit={wait.unit}
            waitValue={wait.value}
            // actions
            onErrorInfoClick={props.showErrorMessage}
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
