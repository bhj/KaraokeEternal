import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import QueueItem from '../../components/QueueItem'
import { parseSeconds } from 'lib/dateTime'

const QUEUE_ITEM_HEIGHT = 80

class QueueList extends React.Component {
  static propTypes = {
    queue: PropTypes.object.isRequired,
    errors: PropTypes.object,
    curId: PropTypes.number,
    curPos: PropTypes.number,
    isAtQueueEnd: PropTypes.bool.isRequired,
    waits: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    ui: PropTypes.object.isRequired,
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    removeItem: PropTypes.func.isRequired,
    showErrorMessage: PropTypes.func.isRequired,
  }

  componentDidMount () {
    // ensure current song is visible
    const idx = this.props.queue.result.indexOf(this.props.curId)
    this.list.scrollToRow(idx)
  }

  render () {
    const props = this.props

    return (
      <PaddedList
        rowCount={props.queue.result.length}
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        paddingTop={props.ui.headerHeight}
        paddingBottom={props.ui.footerHeight}
        width={props.ui.browserWidth}
        height={props.ui.browserHeight}
        scrollToAlignment={'center'}
        queuedSongs={props.queue.result} // pass-through forces List refresh
        curId={props.curId} // pass-through forces List refresh
        curPos={props.curPos} // pass-through forces List refresh
        errors={props.errors} // pass-through forces List refresh
        isAtQueueEnd={props.isAtQueueEnd} // pass-through forces List refresh
        onRef={this.setRef}
      />
    )
  }

  rowRenderer = ({ index, key, style }) => {
    const item = this.props.queue.entities[this.props.queue.result[index]]
    const queueId = item.queueId

    const isActive = (queueId === this.props.curId) && !this.props.isAtQueueEnd
    const isUpcoming = queueId > this.props.curId
    const isOwner = item.userId === this.props.user.userId
    const wait = parseSeconds(this.props.waits[queueId])

    return (
      <QueueItem {...item}
        isActive={isActive}
        isUpcoming={isUpcoming}
        canSkip={isActive && isOwner}
        canRemove={isUpcoming && isOwner}
        hasErrors={typeof this.props.errors[queueId] !== 'undefined'}
        pctPlayed={isActive ? this.props.curPos / item.duration * 100 : 0}
        waitValue={wait.value}
        waitUnit={wait.unit}
        onRemoveClick={() => this.handleRemoveClick(queueId)}
        onSkipClick={this.props.requestPlayNext}
        onErrorInfoClick={() => this.handleErrorInfoClick(queueId)}
        key={key}
        style={style}
      />
    )
  }

  rowHeight = ({ index }) => {
    return QUEUE_ITEM_HEIGHT
  }

  handleRemoveClick = (queueId) => {
    this.props.removeItem(queueId)
  }

  handleErrorInfoClick = (queueId) => {
    this.props.showErrorMessage(this.props.errors[queueId].join('\n\n'))
  }

  setRef = (ref) => {
    this.list = ref
  }
}

export default QueueList
