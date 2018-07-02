import { connect } from 'react-redux'
import Header from './Header'
import { createSelector } from 'reselect'
import { headerHeightChange } from 'store/modules/ui'
import { requestScanCancel } from 'store/modules/prefs'

const getQueue = (state) => state.queue
const getCurId = (state) => state.status.queueId
const getCurPos = (state) => state.status.position
const getIsAtQueueEnd = (state) => state.status.isAtQueueEnd
const getUserId = (state) => state.user.userId

const getStatusProps = createSelector(
  [getQueue, getCurId, getCurPos, getIsAtQueueEnd, getUserId],
  (queue, curId, curPos, isAtQueueEnd, userId) => {
    const curIndex = queue.result.indexOf(curId)
    const curItem = queue.entities[curId]
    const nextItem = queue.entities[queue.result[curIndex + 1]]
    const isUpNext = nextItem ? nextItem.userId === userId : false

    return {
      isUpNext,
      isUpNow: curItem ? !isAtQueueEnd && curItem.userId === userId : false,
      wait: isUpNext && curItem ? curItem.duration - curPos : 0
    }
  }
)

const mapStateToProps = (state) => {
  return {
    ...getStatusProps(state),
    isAdmin: state.user.isAdmin,
    isPlayer: state.location.pathname === '/player',
    isPlayerPresent: state.status.isPlayerPresent,
    isUpdating: state.prefs.isUpdating,
    updateText: state.prefs.updateText,
    updateProgress: state.prefs.updateProgress,
  }
}

const mapActionCreators = {
  headerHeightChange,
  requestScanCancel,
}

export default connect(mapStateToProps, mapActionCreators)(Header)
