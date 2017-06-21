import { connect } from 'react-redux'
import Rooms from './Rooms'
import { openRoomEditor, closeRoomEditor } from 'store/modules/room'

const mapActionCreators = {
  openRoomEditor,
  closeRoomEditor,
}

const mapStateToProps = (state) => ({
  rooms: state.room.rooms,
  isEditing: state.room.isEditing,
  width: state.viewport.width,
})

export default connect(mapStateToProps, mapActionCreators)(Rooms)
