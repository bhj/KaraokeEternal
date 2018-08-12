import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import QueueView from './QueueView'

const mapStateToProps = (state) => {
  return {
    ui: state.ui,
    isInRoom: !!state.user.roomId,
    isQueueEmpty: ensureState(state.queue).result.length === 0,
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
