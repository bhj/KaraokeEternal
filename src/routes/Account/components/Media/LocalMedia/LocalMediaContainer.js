import { connect } from 'react-redux'
import LocalMedia from './LocalMedia'
import { requestScan } from 'routes/Library/modules/library'
import { addPath, removePath, openPathChooser, closePathChooser } from 'store/modules/paths'

const mapActionCreators = {
  addPath,
  removePath,
  openPathChooser,
  closePathChooser,
  requestScan,
}

const mapStateToProps = (state) => ({
  paths: state.paths,
  isChoosing: state.paths.isChoosing,
})

export default connect(mapStateToProps, mapActionCreators)(LocalMedia)
