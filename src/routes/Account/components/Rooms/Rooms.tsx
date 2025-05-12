import React, { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { formatDateTime } from 'lib/dateTime'
import Panel from 'components/Panel/Panel'
import Button from 'components/Button/Button'
import EditRoom from './EditRoom/EditRoom'
import { closeRoomEditor, fetchRooms, filterByStatus, openRoomEditor } from 'store/modules/rooms'
import { filterByRoom } from '../../modules/users'
import getRoomList from '../../selectors/getRoomList'
import styles from './Rooms.css'

const Rooms = () => {
  const [editorRoom, setEditorRoom] = useState(null)

  const { isEditorOpen, filterStatus } = useAppSelector(state => state.rooms)
  const rooms = useAppSelector(getRoomList)

  const dispatch = useAppDispatch()
  const handleClose = useCallback(() => dispatch(closeRoomEditor()), [dispatch])
  const handleFilterChange = useCallback((e) => {
    if (e.target.value === 'all') dispatch(filterByStatus(false))
    else dispatch(filterByStatus(e.target.value))
  }, [dispatch])
  const handleFilterUsers = useCallback(e => dispatch(filterByRoom(parseInt(e.target.dataset.roomId, 10))), [dispatch])
  const handleOpen = useCallback((e) => {
    setEditorRoom(rooms.entities[e.target.dataset.roomId])
    dispatch(openRoomEditor())
  }, [dispatch, rooms])

  // once per mount
  useEffect(() => {
    dispatch(fetchRooms())
  }, [dispatch])

  const rows = rooms.result.map((roomId) => {
    const room = rooms.entities[roomId]
    return (
      <tr key={String(roomId)}>
        <td><a data-room-id={roomId} onClick={handleOpen}>{room.name}</a></td>
        <td>
          {room.status}
          {room.numUsers > 0 && (
            <>
&nbsp;
              <a data-room-id={roomId} onClick={handleFilterUsers}>
                (
                {room.numUsers}
                )
              </a>
            </>
          )}
        </td>
        <td>{formatDateTime(new Date(room.dateCreated * 1000))}</td>
      </tr>
    )
  })

  const roomsFilter = (
    <select className={styles.roomsFilter} onChange={handleFilterChange} value={filterStatus === false ? 'all' : filterStatus as string}>
      <option key='all' value='all'>All</option>
      <option key='open' value='open'>Open</option>
      <option key='closed' value='closed'>Closed</option>
    </select>
  )

  return (
    <Panel title='Rooms' titleComponent={roomsFilter}>
      <>
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
        <Button onClick={handleOpen} variant='primary'>
          Create Room
        </Button>

        {isEditorOpen && <EditRoom onClose={handleClose} room={editorRoom} />}
      </>
    </Panel>
  )
}

export default Rooms
