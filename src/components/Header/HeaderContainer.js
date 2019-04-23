import { connect } from 'react-redux'
import Header from './Header'
import { createSelector } from 'reselect'
import { headerHeightChange } from 'store/modules/ui'
import { requestScanCancel } from 'store/modules/prefs'
import getOrderedQueue from 'routes/Queue/selectors/getOrderedQueue'

const getCurId = (state) => state.status.queueId
const getCurPos = (state) => state.status.position
const getIsAtQueueEnd = (state) => state.status.isAtQueueEnd
const getUserId = (state) => state.user.userId

const getUserWait = createSelector(
  [getOrderedQueue, getCurId, getCurPos, getUserId],
  (queue, curId, curPos, userId) => {
    const { result, entities } = queue
    const curIdx = queue.result.indexOf(curId)

    if (entities[result[curIdx]]) {
      let wait = Math.round(entities[result[curIdx]].duration - curPos)

      for (let i = curIdx + 1; i < result.length; i++) {
        if (entities[result[i]] && entities[result[i]].userId === userId) {
          return wait
        }

        wait += entities[result[i]].duration
      }
    }

    return undefined
  }
)

const getStatusProps = createSelector(
  [getOrderedQueue, getCurId, getIsAtQueueEnd, getUserId],
  (queue, curId, isAtQueueEnd, userId) => {
    const { result, entities } = queue
    const curIdx = result.indexOf(curId)
    const curItem = entities[curId]

    return {
      isUpNext: result[curIdx + 1] ? entities[result[curIdx + 1]].userId === userId : false,
      isUpNow: curItem ? !isAtQueueEnd && curItem.userId === userId : false,
    }
  }
)

const mapStateToProps = (state) => {
  return {
    ...getStatusProps(state),
    wait: getUserWait(state),
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
