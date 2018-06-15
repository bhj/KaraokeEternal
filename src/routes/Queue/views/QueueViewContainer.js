import { connect } from 'react-redux'
import QueueView from './QueueView'

const mapStateToProps = (state) => {
  return {
    user: state.user,
    ui: state.ui,
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
