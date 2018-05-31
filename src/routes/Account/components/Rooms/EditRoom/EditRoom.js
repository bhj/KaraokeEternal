import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { SkyLightStateless } from 'react-skylight'
import './EditRoom.css'

export default class EditRoom extends Component {
  static propTypes = {
    room: PropTypes.object,
    // actions
    closeRoomEditor: PropTypes.func.isRequired,
    createRoom: PropTypes.func.isRequired,
    updateRoom: PropTypes.func.isRequired,
    removeRoom: PropTypes.func.isRequired,
  }

  render () {
    const { room } = this.props

    return (
      <SkyLightStateless
        isVisible
        onCloseClicked={this.props.closeRoomEditor}
        onOverlayClicked={this.props.closeRoomEditor}
        title={room ? 'Room' : 'Create Room'}
        dialogStyles={{
          width: '80%',
          minHeight: '200px',
          left: '10%',
          marginLeft: '0' }}
      >

        <input type='text' placeholder='room name'
          ref={r => { this.roomName = r }}
          defaultValue={room ? room.name : ''}
          onKeyPress={this.handleKeyPress}
          autoFocus={typeof room === 'undefined'}
        />

        <br />

        {!room &&
          <button onClick={this.handleCreateClick} className='primary' styleName='btn'>
            Create Room
          </button>
        }

        {room &&
          <button onClick={this.handleUpdateClick} className='primary' styleName='btn'>
            Update Room
          </button>
        }

        {room &&
          <button onClick={this.handleRemoveClick} styleName='btn'>
            Remove Room
          </button>
        }

        <button onClick={this.props.closeRoomEditor}>Cancel</button>
      </SkyLightStateless>
    )
  }

  handleCreateClick = () => {
    this.props.createRoom({
      name: this.roomName.value,
      status: 'open',
    })
  }

  handleUpdateClick = () => {
    this.props.updateRoom(this.props.room.roomId, {
      name: this.roomName.value,
    })
  }

  handleRemoveClick = () => {
    if (confirm(`Remove room "${this.props.room.name}"?`)) {
      this.props.removeRoom(this.props.room.roomId)
    }
  }

  handleKeyPress = (e) => {
    if (e.charCode === 13) {
      this.props.room ? this.handleUpdateClick() : this.handleCreateClick()
    }
  }
}
