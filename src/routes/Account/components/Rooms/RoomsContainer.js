import { connect } from 'react-redux'
import Rooms from './Rooms'
import { closeRoomEditor, fetchRooms, openRoomEditor, toggleShowAll, updateRoom } from 'store/modules/rooms'
import getRoomList from '../../selectors/getRoomList'

const mapActionCreators = {
  closeRoomEditor,
  fetchRooms,
  openRoomEditor,
  toggleShowAll,
  updateRoom,
}

const mapStateToProps = (state) => ({
  rooms: getRoomList(state),
  isEditing: state.rooms.isEditing,
  isShowingAll: state.rooms.isShowingAll,
  editingRoom: state.rooms.entities[state.rooms.editingRoomId],
})

export default connect(mapStateToProps, mapActionCreators)(Rooms)
