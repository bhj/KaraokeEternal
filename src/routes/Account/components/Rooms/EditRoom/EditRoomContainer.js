import { connect } from 'react-redux'
import EditRoom from './EditRoom'
import { closeRoomEditor, createRoom, updateRoom, removeRoom } from 'store/modules/room'

const mapActionCreators = {
  createRoom,
  updateRoom,
  removeRoom,
  closeRoomEditor,
}

const mapStateToProps = (state) => ({
  isEditing: state.room.isEditing,
  room: state.room.rooms.entities[state.room.editingRoomId],
})

export default connect(mapStateToProps, mapActionCreators)(EditRoom)
