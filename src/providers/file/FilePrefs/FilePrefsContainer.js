import { connect } from 'react-redux'
import FilePrefs from './FilePrefs'
import { fetchProviders, requestScan } from 'store/modules/providers'

const mapActionCreators = {
  fetchProviders,
  requestScan,
}

const mapStateToProps = (state) => ({
  prefs: state.providers.entities.file.prefs,
})

export default connect(mapStateToProps, mapActionCreators)(FilePrefs)
