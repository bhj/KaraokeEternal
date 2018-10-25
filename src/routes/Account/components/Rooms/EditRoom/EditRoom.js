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

  constructor (props) {
    super(props)
    this.text = React.createRef()
    this.checkbox = React.createRef()
  }

  render () {
    const { room, closeRoomEditor } = this.props

    return (
      <>
        <input type='text'
          placeholder='room name'
          ref={this.text}
          defaultValue={room ? room.name : ''}
          onKeyPress={this.handleKeyPress}
          autoFocus={typeof room === 'undefined'}
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

  handleCreateClick = () => {
    this.props.createRoom({
      name: this.text.current.value,
      status: 'open',
    })
  }

  handleUpdateClick = () => {
    this.props.updateRoom(this.props.room.roomId, {
      name: this.text.current.value,
      status: this.checkbox.current.checked ? 'open' : 'closed',
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
