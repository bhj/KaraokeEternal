import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import QueueView from './QueueView'

const mapStateToProps = (state) => {
  return {
    isInRoom: !!state.user.roomId,
    isLoading: ensureState(state.queue).isLoading,
    isQueueEmpty: ensureState(state.queue).result.length === 0,
    ui: state.ui,
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
