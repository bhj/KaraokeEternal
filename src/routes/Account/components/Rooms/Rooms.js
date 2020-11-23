import React, { useCallback, useEffect, useState } from 'react'
import { Column, Table } from 'react-virtualized'
import { useDispatch, useSelector } from 'react-redux'
import { formatDateTime } from 'lib/dateTime'
import EditRoom from './EditRoom'
import { closeRoomEditor, fetchRooms, openRoomEditor, toggleShowAll } from 'store/modules/rooms'
import getRoomList from '../../selectors/getRoomList'
import style from './Rooms.css'

const Rooms = props => {
  const [editorRoom, setEditorRoom] = useState(null)

  const { isEditorOpen, isShowingAll } = useSelector(state => state.rooms)
  const rooms = useSelector(getRoomList)
  const ui = useSelector(state => state.ui)

  const dispatch = useDispatch()
  const handleClose = useCallback(() => dispatch(closeRoomEditor()), [dispatch])
  const handleOpen = useCallback(roomId => {
    setEditorRoom(rooms.entities[roomId])
    dispatch(openRoomEditor())
  }, [dispatch, rooms])
  const handleToggle = useCallback(() => dispatch(toggleShowAll()), [dispatch])

  useEffect(() => {
    dispatch(fetchRooms())
  }, []) // once per mount

  const tableRef = React.createRef()
  const getRow = ({ index }) => rooms.entities[rooms.result[index]]

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
        <Table
          width={ui.contentWidth}
          height={rooms.result.length * 30 + 20}
          headerHeight={20}
          rowHeight={30}
          rowCount={rooms.result.length}
          rowGetter={getRow}
          headerClassName={style.tableHeader}
          rowClassName={style.tableRow}
          ref={tableRef}
          styleName='table'
        >
          <Column
            label='Name'
            dataKey='name'
            width={ui.contentWidth * 0.40}
            styleName='tableCol'
            cellRenderer={({ rowData }) => (
              <a onClick={() => handleOpen(rowData.roomId)}>{rowData.name}</a>
            )}
          />
          <Column
            label='Status'
            dataKey='status'
            width={ui.contentWidth * 0.20}
            styleName='tableCol'
            cellRenderer={({ rowData }) => rowData.status + (rowData.numUsers ? ` (${rowData.numUsers})` : '')}
          />
          <Column
            label='Created'
            dataKey='dateCreated'
            width={ui.contentWidth * 0.40}
            styleName='tableCol'
            cellRenderer={({ rowData }) => formatDateTime(new Date(rowData.dateCreated * 1000))}
          />
        </Table>

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
