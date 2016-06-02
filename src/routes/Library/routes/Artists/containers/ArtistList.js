import { connect } from 'react-redux'
import ArtistList from '../components/ArtistList'

const mapActionCreators = {}

const mapStateToProps = (state) => ({
  result: state.artists.result,
  entities: state.artists.entities
})

export default connect(mapStateToProps, mapActionCreators)(ArtistList)
