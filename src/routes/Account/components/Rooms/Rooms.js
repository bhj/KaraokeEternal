import PropTypes from 'prop-types'
import React, { Component } from 'react'
import EditRoom from './EditRoom'
import { Column, Table } from 'react-virtualized'
import style from './Rooms.css'
import tableStyle from 'react-virtualized/styles.css'

export default class Rooms extends Component {
  static propTypes = {
    rooms: PropTypes.object.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    width: PropTypes.number,
    // Actions
    openRoomEditor: PropTypes.func.isRequired,
    fetchRooms: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchRooms()
  }

  render () {
    const { rooms, isAdmin, width } = this.props

    if (!isAdmin || typeof width === 'undefined') return null

    return (
      <div>
        <h1 styleName='style.title'>Rooms</h1>
        <Table
          width={width}
          height={rooms.result.length * 30 + 20}
          headerHeight={20}
          rowHeight={30}
          rowCount={rooms.result.length}
          rowGetter={({ index }) => rooms.entities[rooms.result[index]]}
          headerClassName={tableStyle.ReactVirtualized__Table__headerRow}
          rowClassName={tableStyle.ReactVirtualized__Table__row}
        >
          <Column
            label='Name'
            dataKey='name'
            width={width * 0.40}
            cellRenderer={({ rowData }) => (
              <a onClick={() => this.props.openRoomEditor(rowData.roomId)}>{rowData.name}</a>
            )}
          />
          <Column
            label='Status'
            dataKey='status'
            width={width * 0.20}
          />
          <Column
            label='Created'
            dataKey='dateCreated'
            width={width * 0.30}
          />
          <Column
            label='# in'
            dataKey='numOccupants'
            width={width * 0.10}
          />
        </Table>

        <button onClick={() => this.props.openRoomEditor()}>
          Create Room
        </button>

        <EditRoom />
      </div>
    )
  }
}
