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

  constructor (props) {
    super(props)
    this.state = { showClosed: false }
    this.table = React.createRef()
  }

  componentDidMount () {
    this.props.fetchRooms()
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.showClosed !== this.state.showClosed) {
      this.table.current.recomputeRowHeights()
    }
  }

  render () {
    const { rooms, isAdmin, width } = this.props
    const { showClosed } = this.state

    if (!isAdmin || typeof width === 'undefined') return null

    return (
      <div styleName='style.container'>
        <div styleName='style.titleContainer'>
          <h1 styleName='style.title'>Rooms</h1>
          <label>
            <input type='checkbox'
              checked={!this.state.showClosed}
              onChange={this.handleToggle}
            /> Hide closed
          </label>
        </div>
        <div styleName='style.content'>
          <Table
            width={width}
            height={rooms.result.filter(i => rooms.entities[i].status === 'open' || showClosed).length * 30 + 20}
            headerHeight={20}
            rowHeight={this.getRowHeight}
            rowCount={rooms.result.length}
            rowGetter={this.getRow}
            headerClassName={style.tableHeader}
            rowClassName={style.tableRow}
            ref={this.table}
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
              marginLeft: '0',
            }}
          >
            {this.props.isEditorOpen &&
              <EditRoom room={this.props.editingRoom }/>
            }
          </SkyLightStateless>
        </div>
      </div>
    )
  }

  handleToggle = (e) => {
    this.setState({ showClosed: !this.state.showClosed })
  }

  getRowHeight = ({ index }) => {
    const { status } = this.props.rooms.entities[this.props.rooms.result[index]]
    return status === 'open' || this.state.showClosed ? 30 : 0
  }

  getRow = ({ index }) => this.props.rooms.entities[this.props.rooms.result[index]]
}
