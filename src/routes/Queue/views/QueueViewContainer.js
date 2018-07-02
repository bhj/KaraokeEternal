import { connect } from 'react-redux'
import QueueView from './QueueView'

const mapStateToProps = (state) => {
  return {
    ui: state.ui,
    isInRoom: !!state.user.roomId,
    isQueueEmpty: state.queue.result.length === 0,
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
