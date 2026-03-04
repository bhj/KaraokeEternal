import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { formatDateTime } from 'lib/dateTime'
import { useT } from 'i18n'
import Panel from 'components/Panel/Panel'
import Button from 'components/Button/Button'
import EditRoom from './EditRoom/EditRoom'
import { closeRoomEditor, fetchRooms, filterByStatus, openRoomEditor } from 'store/modules/rooms'
import { filterByRoom } from '../../modules/users'
import getRoomList from '../../selectors/getRoomList'
import styles from './Rooms.css'

const Rooms = () => {
  const t = useT()
  const [editorRoom, setEditorRoom] = useState(null)

  const { isEditorOpen, filterStatus } = useAppSelector(state => state.rooms)
  const rooms = useAppSelector(getRoomList)

  const dispatch = useAppDispatch()
  const handleClose = () => dispatch(closeRoomEditor())
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.currentTarget.value === 'all') dispatch(filterByStatus(false))
    else dispatch(filterByStatus(e.currentTarget.value))
  }
  const handleFilterUsers = (e: React.MouseEvent<HTMLElement>) => dispatch(filterByRoom(parseInt(e.currentTarget.dataset.roomId)))
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setEditorRoom(rooms.entities[parseInt(e.currentTarget.dataset.roomId || '0')])
    dispatch(openRoomEditor())
  }

  // once per mount
  useEffect(() => {
    dispatch(fetchRooms())
  }, [dispatch])

  const rows = rooms.result.map((roomId) => {
    const room = rooms.entities[roomId]
    return (
      <tr key={String(roomId)}>
        <td translate='no'><a data-room-id={roomId} onClick={handleOpen}>{room.name}</a></td>
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
      <option key='all' value='all'>{t('rooms', 'filterAll')}</option>
      <option key='open' value='open'>{t('rooms', 'filterOpen')}</option>
      <option key='closed' value='closed'>{t('rooms', 'filterClosed')}</option>
    </select>
  )

  return (
    <Panel title={t('rooms', 'title')} titleComponent={roomsFilter}>
      <>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('rooms', 'colName')}</th>
              <th>{t('rooms', 'colStatus')}</th>
              <th>{t('rooms', 'colCreated')}</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>

        <br />
        <Button onClick={handleOpen} variant='primary'>
          {t('rooms', 'createRoom')}
        </Button>

        {isEditorOpen && <EditRoom onClose={handleClose} room={editorRoom} />}
      </>
    </Panel>
  )
}

export default Rooms
