import { connect } from 'react-redux'
import PlayerView from './PlayerView'

const mapStateToProps = (state) => {
  return {
    ui: state.ui,
    isQueueEmpty: state.queue.result.length === 0,
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
