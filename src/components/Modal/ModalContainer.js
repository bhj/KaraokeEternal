import Modal from './Modal'
import { connect } from 'react-redux'

const mapStateToProps = (state) => {
  return {
    ui: state.ui,
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(Modal)
