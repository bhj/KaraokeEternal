import { connect } from 'react-redux'
import QueueView from './QueueView'

const mapStateToProps = (state) => {
  return {
    user: state.user,
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
