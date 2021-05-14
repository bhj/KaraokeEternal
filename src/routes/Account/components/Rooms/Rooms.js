import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatDateTime } from 'lib/dateTime'
import EditRoom from './EditRoom'
import { closeRoomEditor, fetchRooms, openRoomEditor, toggleShowAll } from 'store/modules/rooms'
import { filterByRoom } from '../../modules/users'
import getRoomList from '../../selectors/getRoomList'
import './Rooms.css'

const Rooms = props => {
  const [editorRoom, setEditorRoom] = useState(null)

  const { isEditorOpen, isShowingAll } = useSelector(state => state.rooms)
  const rooms = useSelector(getRoomList)

  const dispatch = useDispatch()
  const handleClose = useCallback(() => dispatch(closeRoomEditor()), [dispatch])
  const handleFilter = useCallback(e => dispatch(filterByRoom(parseInt(e.target.dataset.roomId, 10))), [dispatch])
  const handleOpen = useCallback(e => {
    setEditorRoom(rooms.entities[e.target.dataset.roomId])
    dispatch(openRoomEditor())
  }, [dispatch, rooms])
  const handleToggle = useCallback(() => dispatch(toggleShowAll()), [dispatch])

  useEffect(() => {
    dispatch(fetchRooms())
  }, []) // once per mount

  const rows = rooms.result.map(roomId => {
    const room = rooms.entities[roomId]
    return (
      <tr key={roomId}>
        <td><a data-room-id={roomId} onClick={handleOpen}>{room.name}</a></td>
        <td>
          {room.status}
          {room.numUsers > 0 &&
            <>&nbsp;<a data-room-id={roomId} onClick={handleFilter}>({room.numUsers})</a></>
          }
        </td>
        <td>{formatDateTime(new Date(room.dateCreated * 1000))}</td>
      </tr>
    )
  })

  return (
    <div styleName='container'>
      <div styleName='titleContainer'>
        <h1 styleName='title'>Rooms</h1>
        <label styleName='showAll'>
          <input type='checkbox'
            checked={isShowingAll}
            onChange={handleToggle}
            styleName='showAll'
          /> Show all
        </label>
      </div>
      <div styleName='content'>
        <table styleName='table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>

        <br />
        <button onClick={handleOpen} className='primary'>
          Create Room
        </button>

        <EditRoom isVisible={isEditorOpen} onClose={handleClose} room={editorRoom} />
      </div>
    </div>
  )
}

export default Rooms
