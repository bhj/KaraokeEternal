import PropTypes from 'prop-types'
import React, { Component } from 'react'
import EditRoom from './EditRoom'
import { Column, Table } from 'react-virtualized'
import styles from 'react-virtualized/styles.css'

export default class Rooms extends Component {
  static propTypes = {
    rooms: PropTypes.object.isRequired,
    width: PropTypes.number,
    // Actions
    openRoomEditor: PropTypes.func.isRequired,
    fetchRooms: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchRooms()
  }

  render () {
    const { rooms, width } = this.props

    if (typeof width === 'undefined') return null

    return (
      <div>
        <h1>Rooms</h1>
        <Table
          width={width}
          height={rooms.result.length * 30 + 20}
          headerHeight={20}
          rowHeight={30}
          rowCount={rooms.result.length}
          rowGetter={({ index }) => rooms.entities[rooms.result[index]]}
          headerClassName={styles.ReactVirtualized__Table__headerRow}
          rowClassName={styles.ReactVirtualized__Table__row}
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

        <button onClick={() => this.props.openRoomEditor()} className='button wide green raised'>
          Create Room
        </button>

        <EditRoom />
      </div>
    )
  }
}
