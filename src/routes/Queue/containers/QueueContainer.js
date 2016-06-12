import { connect } from 'react-redux'
import { fetchQueue, queueSong } from '../modules/queue'
import QueueView from '../components/QueueView'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  fetchQueue,
  queueSong
}

const mapStateToProps = (state) => ({
  uids: state.queue.result,
  songs: state.queue.entities,
  errorMessage: state.queue.errorMessage
})

export default connect(mapStateToProps, mapActionCreators)(QueueView)
