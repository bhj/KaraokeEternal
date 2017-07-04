import { connect } from 'react-redux'
import RoomSelect from './RoomSelect'
import { fetchRooms } from 'store/modules/rooms'

const mapActionCreators = {
  fetchRooms,
}

const mapStateToProps = (state) => {
  return {
    rooms: state.rooms,
  }
}

export default connect(mapStateToProps, mapActionCreators)(RoomSelect)
