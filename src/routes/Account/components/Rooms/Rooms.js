import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatDateTime } from 'lib/dateTime'
import EditRoom from './EditRoom'
import { closeRoomEditor, fetchRooms, filterByStatus, openRoomEditor } from 'store/modules/rooms'
import { filterByRoom } from '../../modules/users'
import getRoomList from '../../selectors/getRoomList'
import styles from './Rooms.css'

const Rooms = props => {
  const [editorRoom, setEditorRoom] = useState(null)

  const { isEditorOpen, filterStatus } = useSelector(state => state.rooms)
  const rooms = useSelector(getRoomList)

  const dispatch = useDispatch()
  const handleClose = useCallback(() => dispatch(closeRoomEditor()), [dispatch])
  const handleFilterChange = useCallback(e => {
    if (e.target.value === 'all') dispatch(filterByStatus(false))
    else dispatch(filterByStatus(e.target.value))
  }, [dispatch])
  const handleFilterUsers = useCallback(e => dispatch(filterByRoom(parseInt(e.target.dataset.roomId, 10))), [dispatch])
  const handleOpen = useCallback(e => {
    setEditorRoom(rooms.entities[e.target.dataset.roomId])
    dispatch(openRoomEditor())
  }, [dispatch, rooms])

  // once per mount
  useEffect(() => {
    dispatch(fetchRooms())
  }, [dispatch])

  const rows = rooms.result.map(roomId => {
    const room = rooms.entities[roomId]
    return (
      <tr key={roomId}>
        <td><a data-room-id={roomId} onClick={handleOpen}>{room.name}</a></td>
        <td>
          {room.status}
          {room.numUsers > 0 &&
            <>&nbsp;<a data-room-id={roomId} onClick={handleFilterUsers}>({room.numUsers})</a></>
          }
        </td>
        <td>{formatDateTime(new Date(room.dateCreated * 1000))}</td>
      </tr>
    )
  })

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Rooms</h1>
        <select onChange={handleFilterChange} value={filterStatus === false ? 'all' : filterStatus}>
          <option key='all' value={'all'}>All</option>
          <option key='open' value={'open'}>Open</option>
          <option key='closed' value={'closed'}>Closed</option>
        </select>
      </div>
      <div className={styles.content}>
        <table className={styles.table}>
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
