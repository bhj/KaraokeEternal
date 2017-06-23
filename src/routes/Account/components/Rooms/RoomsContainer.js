import { connect } from 'react-redux'
import Rooms from './Rooms'
import { fetchRooms, openRoomEditor, closeRoomEditor } from 'store/modules/rooms'

const mapActionCreators = {
  fetchRooms,
  openRoomEditor,
  closeRoomEditor,
}

const mapStateToProps = (state) => ({
  rooms: state.rooms,
  isEditing: state.roomsisEditing,
  width: state.viewport.width,
})

export default connect(mapStateToProps, mapActionCreators)(Rooms)
