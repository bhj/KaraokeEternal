import { connect } from 'react-redux'
import Rooms from './Rooms'
import { openRoomEditor, closeRoomEditor } from 'store/modules/rooms'

const mapActionCreators = {
  openRoomEditor,
  closeRoomEditor,
}

const mapStateToProps = (state) => ({
  rooms: state.rooms,
  isEditing: state.roomsisEditing,
  width: state.viewport.width,
})

export default connect(mapStateToProps, mapActionCreators)(Rooms)
