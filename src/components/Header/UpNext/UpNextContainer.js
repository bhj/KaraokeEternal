import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import UpNext from './UpNext'

const getQueue = (state) => state.queue
const getCurId = (state) => state.status.queueId
const getCurPos = (state) => state.status.position
const getIsAtQueueEnd = (state) => state.status.isAtQueueEnd
const getUserId = (state) => state.user.userId

const getProps = createSelector(
  [getQueue, getCurId, getCurPos, getIsAtQueueEnd, getUserId],
  (queue, curId, curPos, isAtQueueEnd, userId) => {
    const curIndex = queue.result.indexOf(curId)
    const curItem = queue.entities[curId]
    const nextItem = queue.entities[queue.result[curIndex + 1]]
    const isUpNext = nextItem ? nextItem.userId === userId : false

    return {
      isUpNow: curItem ? !isAtQueueEnd && curItem.userId === userId : false,
      isUpNext,
      wait: isUpNext && curItem ? curItem.duration - curPos : 0
    }
  }
)

const mapStateToProps = (state) => {
  return {
    ...getProps(state)
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(UpNext)
