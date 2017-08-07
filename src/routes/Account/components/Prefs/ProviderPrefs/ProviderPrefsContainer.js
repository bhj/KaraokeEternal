import { connect } from 'react-redux'
import ProviderPrefs from './ProviderPrefs'
import { fetchProviders, requestScan } from 'store/modules/providers'

const mapActionCreators = {
  fetchProviders,
  requestScan,
}

const mapStateToProps = (state) => ({
  providers: state.providers,
})

export default connect(mapStateToProps, mapActionCreators)(ProviderPrefs)
