import { connect } from 'react-redux'
import Navigation from './Navigation'
import { setFooterHeight } from 'store/modules/ui'

const mapActionCreators = {
  setFooterHeight,
}

const mapStateToProps = (state) => {
  return {
  }
}

export default connect(mapStateToProps, mapActionCreators)(Navigation)
