import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { SkyLightStateless } from 'react-skylight'

export default class EditRoom extends Component {
  static propTypes = {
    isEditing: PropTypes.bool.isRequired,
    room: PropTypes.object,
    // actions
    closeRoomEditor: PropTypes.func.isRequired,
    createRoom: PropTypes.func.isRequired,
    updateRoom: PropTypes.func.isRequired,
    removeRoom: PropTypes.func.isRequired,
  }

  render () {
    const { isEditing, room } = this.props

    return (
      <SkyLightStateless
        isVisible={isEditing}
        onCloseClicked={this.props.closeRoomEditor}
        onOverlayClicked={this.props.closeRoomEditor}
        title={room ? 'Room' : 'Create Room'}
        dialogStyles={{
          width: '80%',
          height: 'auto',
          left: '10%',
          marginLeft: '0' }}
      >

        <input type='text' ref='name' placeholder='room name'
          defaultValue={room ? room.name : ''}
          autoFocus={typeof room === 'undefined'}
        />

        <label>
          <input type='checkbox' ref='status'
            defaultChecked={!room || room.status === 'open'} />
          &nbsp;Open
        </label>

        {!room &&
          <button onClick={this.handleCreateClick} className='button'>
            Create Room
          </button>
        }

        {room &&
          <button onClick={this.handleUpdateClick} className='button'>
            Update Room
          </button>
        }

        {room &&
          <button onClick={this.handleRemoveClick} className='button'>
            Remove Room
          </button>
        }

        <button onClick={this.props.closeRoomEditor} className='button'>Cancel</button>
      </SkyLightStateless>
    )
  }

  handleCreateClick = () => {
    const { name, status } = this.refs

    this.props.createRoom({
      name: name.value,
      status: status.checked ? 'open' : 'closed',
    })
  }

  handleUpdateClick = () => {
    const { name, status } = this.refs

    this.props.updateRoom(this.props.room.roomId, {
      name: name.value,
      status: status.checked ? 'open' : 'closed',
    })
  }

  handleRemoveClick = () => {
    if (confirm(`Remove room "${this.props.room.name}"?`)) {
      this.props.removeRoom(this.props.room.roomId)
    }
  }
}
