import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { formatDateTime } from 'lib/dateTime'
import Modal from 'components/Modal'
import EditRoom from './EditRoom'
import { Column, Table } from 'react-virtualized'
import style from './Rooms.css'

export default class Rooms extends Component {
  static propTypes = {
    rooms: PropTypes.object.isRequired,
    isEditing: PropTypes.bool.isRequired,
    isShowingAll: PropTypes.bool.isRequired,
    editingRoom: PropTypes.object,
    ui: PropTypes.object.isRequired,
    // Actions
    closeRoomEditor: PropTypes.func.isRequired,
    fetchRooms: PropTypes.func.isRequired,
    openRoomEditor: PropTypes.func.isRequired,
    toggleShowAll: PropTypes.func.isRequired,
    updateRoom: PropTypes.func.isRequired,
  }

  table = React.createRef()

  componentDidMount () {
    this.props.fetchRooms()
  }

  render () {
    return (
      <div styleName='style.container'>
        <div styleName='style.titleContainer'>
          <h1 styleName='style.title'>Rooms</h1>
          <label>
            <input type='checkbox'
              checked={this.props.isShowingAll}
              onChange={this.props.toggleShowAll}
            /> Show all
          </label>
        </div>
        <div styleName='style.content'>
          <Table
            width={this.props.ui.contentWidth}
            height={this.props.rooms.result.length * 30 + 20}
            headerHeight={20}
            rowHeight={30}
            rowCount={this.props.rooms.result.length}
            rowGetter={this.getRow}
            headerClassName={style.tableHeader}
            rowClassName={style.tableRow}
            ref={this.table}
            styleName='table'
          >
            <Column
              label='Name'
              dataKey='name'
              width={this.props.ui.contentWidth * 0.40}
              styleName='style.tableCol'
              cellRenderer={({ rowData }) => (
                <a onClick={() => this.props.openRoomEditor(rowData.roomId)}>{rowData.name}</a>
              )}
            />
            <Column
              label='Status'
              dataKey='status'
              width={this.props.ui.contentWidth * 0.20}
              styleName='style.tableCol'
              cellRenderer={({ rowData }) => rowData.status + (rowData.numUsers ? ` (${rowData.numUsers})` : '')}
            />
            <Column
              label='Created'
              dataKey='dateCreated'
              width={this.props.ui.contentWidth * 0.40}
              styleName='style.tableCol'
              cellRenderer={({ rowData }) => formatDateTime(new Date(rowData.dateCreated * 1000))}
            />
          </Table>

          <br />
          <button onClick={() => this.props.openRoomEditor()} className='primary'>
            Create Room
          </button>

          <Modal
            isVisible={this.props.isEditing}
            onClose={this.props.closeRoomEditor}
            title={this.props.editingRoom ? 'Edit Room' : 'Create Room'}
            style={{ minWidth: '300px' }}
          >
            {this.props.isEditing &&
              <EditRoom room={this.props.editingRoom }/>
            }
          </Modal>
        </div>
      </div>
    )
  }

  getRow = ({ index }) => this.props.rooms.entities[this.props.rooms.result[index]]
}
