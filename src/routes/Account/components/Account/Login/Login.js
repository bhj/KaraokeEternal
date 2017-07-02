import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class Login extends Component {
  render () {
    const { rooms } = this.props

    let roomOpts = rooms.result.map(roomId => {
      const room = rooms.entities[roomId]

      return (
        <option key={roomId} value={roomId}>{room.name}</option>
      )
    })

    return (
      <form>
        <input type='email' ref='email' placeholder='email' autoFocus />
        <input type='password' ref='password' placeholder='password' />
        <br />
        <label>Room</label>
        <select ref='room'>{roomOpts}</select>
        <br />

        <button onClick={this.handleClick}>
          Sign In
        </button>
      </form>
    )
  }

  handleClick = (event) => {
    event.preventDefault()
    const creds = {
      email: this.refs.email.value,
      password: this.refs.password.value,
      roomId: parseInt(this.refs.room.value, 10),
    }

    this.props.onSubmitClick(creds)
  }
}

Login.propTypes = {
  rooms: PropTypes.object.isRequired,
  onSubmitClick: PropTypes.func.isRequired,
}
