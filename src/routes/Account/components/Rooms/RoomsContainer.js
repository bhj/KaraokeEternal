import { connect } from 'react-redux'
import Rooms from './Rooms'
import { fetchRooms, openRoomEditor, closeRoomEditor, updateRoom } from 'store/modules/rooms'

const mapActionCreators = {
  fetchRooms,
  openRoomEditor,
  closeRoomEditor,
  updateRoom,
}

const mapStateToProps = (state) => ({
  rooms: state.rooms,
  isEditorOpen: state.rooms.isEditorOpen,
  editingRoom: state.rooms.entities[state.rooms.editingRoomId],
  isAdmin: state.user.isAdmin,
  width: state.ui.viewportWidth,
})

export default connect(mapStateToProps, mapActionCreators)(Rooms)
