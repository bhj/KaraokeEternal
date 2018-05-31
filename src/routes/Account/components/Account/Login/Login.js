import PropTypes from 'prop-types'
import React, { Component } from 'react'
import RoomSelect from '../RoomSelect'
import './Login.css'

export default class Login extends Component {
  static propTypes = {
    onSubmitClick: PropTypes.func.isRequired,
  }

  render () {
    return (
      <form>
        <input type='text' placeholder='username or email'
          autoFocus
          ref={r => { this.username = r }}
        />
        <input type='password' placeholder='password'
          ref={r => { this.password = r }}
        />
        <RoomSelect onSelect={this.handleRoomSelect} />

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
      username: this.username.value.trim(),
      password: this.password.value,
      roomId: this.roomId,
    }

    this.props.onSubmitClick(creds)
  }
}
