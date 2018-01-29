import { connect } from 'react-redux'
import ViewOptions from './ViewOptions'
import { setFilterStatus } from '../../../modules/library'

const mapActionCreators = {
  setFilterStatus,
}

const mapStateToProps = (state) => {
  return {
    filterStatus: state.library.filterStatus,
  }
}

export default connect(mapStateToProps, mapActionCreators)(ViewOptions)
