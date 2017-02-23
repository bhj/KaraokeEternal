import { connect } from 'react-redux'
import PlayerHeader from './PlayerHeader'
import { restartQueue } from '../../modules/player'

const mapActionCreators = {
}

const mapStateToProps = (state) => {
  return {}
}

export default connect(mapStateToProps, mapActionCreators)(PlayerHeader)
