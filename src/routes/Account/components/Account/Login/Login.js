import PropTypes from 'prop-types'
import React, { Component } from 'react'
import RoomSelect from '../RoomSelect'

export default class Login extends Component {
  static propTypes = {
    onSubmitClick: PropTypes.func.isRequired,
  }

  render () {
    return (
      <form>
        <input type='text' ref='username' placeholder='username or email' autoFocus />
        <input type='password' ref='password' placeholder='password' />
        <RoomSelect onRoomSelect={this.handleRoomSelect} />
        <br />
        <button onClick={this.handleSubmit} className='primary'>
          Sign In
        </button>
      </form>
    )
  }

  handleRoomSelect = (roomId) => {
    this.roomId = roomId
  }

  handleSubmit = (event) => {
    event.preventDefault()
    const creds = {
      username: this.refs.username.value.trim(),
      password: this.refs.password.value,
      roomId: this.roomId,
    }

    this.props.onSubmitClick(creds)
  }
}
