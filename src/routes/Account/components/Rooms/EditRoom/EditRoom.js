import PropTypes from 'prop-types'
import React, { Component } from 'react'
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

  state = {
    isPasswordDirty: false,
  }

  checkbox = React.createRef()
  nameInput = React.createRef()
  passwordInput = React.createRef()

  handleCreateClick = () => {
    this.props.createRoom({
      name: this.nameInput.current.value,
      password: this.passwordInput.current.value,
      status: this.checkbox.current.checked ? 'open' : 'closed',
    })
  }

  handleUpdateClick = () => {
    this.props.updateRoom(this.props.room.roomId, {
      name: this.nameInput.current.value,
      password: this.state.isPasswordDirty ? this.passwordInput.current.value : undefined,
      status: this.checkbox.current.checked ? 'open' : 'closed',
    })
  }

  handleRemoveClick = () => {
    if (confirm(`Remove room "${this.props.room.name}" and its queue?`)) {
      this.props.removeRoom(this.props.room.roomId)
    }
  }

  handleKeyPress = (e) => {
    if (e.charCode === 13) {
      this.props.room ? this.handleUpdateClick() : this.handleCreateClick()
    }
  }

  handlePasswordChange = (e) => {
    this.setState({ isPasswordDirty: true })
  }

  render () {
    const { room, closeRoomEditor } = this.props

    return (
      <>
        <input type='text'
          autoComplete='off'
          autoFocus={typeof room === 'undefined'}
          defaultValue={room ? room.name : ''}
          onKeyPress={this.handleKeyPress}
          placeholder='room name'
          ref={this.nameInput}
          styleName='field'
        />

        <input type='password'
          autoComplete='off'
          defaultValue={room && room.hasPassword ? '*'.repeat(32) : ''}
          onChange={this.handlePasswordChange}
          onKeyPress={this.handleKeyPress}
          placeholder='room password (optional)'
          ref={this.passwordInput}
          styleName='field'
        />

        <label>
          <input type='checkbox'
            defaultChecked={!room || room.status === 'open'}
            ref={this.checkbox}
          /> Open
        </label>

        <br />
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

        <button onClick={closeRoomEditor}>Cancel</button>
      </>
    )
  }
}
