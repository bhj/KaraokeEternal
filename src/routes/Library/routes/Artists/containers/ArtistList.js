import { connect } from 'react-redux'
import ArtistList from '../components/ArtistList'

const mapActionCreators = {}

const mapStateToProps = (state) => ({
  ids: state.library.result,
  artists: state.library.entities
})

export default connect(mapStateToProps, mapActionCreators)(ArtistList)
