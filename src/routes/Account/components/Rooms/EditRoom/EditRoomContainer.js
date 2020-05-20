import { connect } from 'react-redux'
import EditRoom from './EditRoom'
import { closeRoomEditor, createRoom, updateRoom, removeRoom } from 'store/modules/rooms'

const mapActionCreators = {
  createRoom,
  updateRoom,
  removeRoom,
  closeRoomEditor,
}

const mapStateToProps = (state) => ({
  isEditing: state.rooms.isEditing,
  room: state.rooms.entities[state.rooms.editingRoomId],
})

export default connect(mapStateToProps, mapActionCreators)(EditRoom)
