import { connect } from 'react-redux'
import ViewOptions from './ViewOptions'
import { changeView } from '../../../modules/library'

const mapActionCreators = {
  changeView,
}

const mapStateToProps = (state) => {
  return {
    view: state.library.view,
  }
}

export default connect(mapStateToProps, mapActionCreators)(ViewOptions)
