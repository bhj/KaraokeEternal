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
          onKeyPress={this.handleKeyPress}
          autoFocus={typeof room === 'undefined'}
        />

        <br />

        {!room &&
          <button onClick={this.handleCreateClick}>
            Create Room
          </button>
        }

        {room &&
          <button onClick={this.handleUpdateClick}>
            Update Room
          </button>
        }

        {room &&
          <button onClick={this.handleRemoveClick}>
            Remove Room
          </button>
        }

        <button onClick={this.props.closeRoomEditor}>Cancel</button>
      </SkyLightStateless>
    )
  }

  handleCreateClick = () => {
    this.props.createRoom({
      name: this.refs.name.value,
      status: 'open',
    })
  }

  handleUpdateClick = () => {
    this.props.updateRoom(this.props.room.roomId, {
      name: this.refs.name.value,
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
