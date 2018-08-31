import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { formatDateTime } from 'lib/dateTime'
import { SkyLightStateless } from 'react-skylight'
import EditRoom from './EditRoom'
import { Column, Table } from 'react-virtualized'
import style from './Rooms.css'

export default class Rooms extends Component {
  static propTypes = {
    rooms: PropTypes.object.isRequired,
    isEditorOpen: PropTypes.bool.isRequired,
    editingRoom: PropTypes.object,
    isAdmin: PropTypes.bool.isRequired,
    width: PropTypes.number,
    // Actions
    openRoomEditor: PropTypes.func.isRequired,
    closeRoomEditor: PropTypes.func.isRequired,
    fetchRooms: PropTypes.func.isRequired,
    updateRoom: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchRooms()
  }

  toggleStatus (roomId) {
    this.props.updateRoom(roomId, {
      status: this.props.rooms.entities[roomId].status === 'open' ? 'closed' : 'open',
    })
  }

  render () {
    const { rooms, isAdmin, width } = this.props

    if (!isAdmin || typeof width === 'undefined') return null

    return (
      <div styleName='style.container'>
        <h1 styleName='style.title'>Rooms</h1>
        <div styleName='style.content'>
          <Table
            width={width}
            height={rooms.result.length * 30 + 20}
            headerHeight={20}
            rowHeight={30}
            rowCount={rooms.result.length}
            rowGetter={({ index }) => rooms.entities[rooms.result[index]]}
            headerClassName={style.tableHeader}
            rowClassName={style.tableRow}
          >
            <Column
              label='Name'
              dataKey='name'
              width={width * 0.40}
              styleName='style.tableCol'
              cellRenderer={({ rowData }) => (
                <a onClick={() => this.props.openRoomEditor(rowData.roomId)}>{rowData.name}</a>
              )}
            />
            <Column
              label='Status'
              dataKey='status'
              width={width * 0.20}
              styleName='style.tableCol'
              cellRenderer={({ rowData }) => rowData.status + (rowData.numUsers ? ` (${rowData.numUsers})` : '')}
            />
            <Column
              label='Created'
              dataKey='dateCreated'
              width={width * 0.40}
              styleName='style.tableCol'
              cellRenderer={({ rowData }) => formatDateTime(new Date(rowData.dateCreated * 1000))}
            />
          </Table>

          <br />
          <button onClick={() => this.props.openRoomEditor()} className='primary'>
            Create Room
          </button>

          <SkyLightStateless
            isVisible={this.props.isEditorOpen}
            onCloseClicked={this.props.closeRoomEditor}
            onOverlayClicked={this.props.closeRoomEditor}
            title={this.props.editingRoom ? 'Edit Room' : 'Create Room'}
            dialogStyles={{
              width: '80%',
              minHeight: '200px',
              left: '10%',
              marginLeft: '0' }}
          >
            {this.props.isEditorOpen &&
              <EditRoom room={this.props.editingRoom }/>
            }
          </SkyLightStateless>
        </div>
      </div>
    )
  }
}
