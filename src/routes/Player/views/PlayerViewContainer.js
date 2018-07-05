import { connect } from 'react-redux'
import PlayerView from './PlayerView'

const mapStateToProps = (state) => {
  return {
    ui: state.ui,
  }
}

const mapActionCreators = {
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
