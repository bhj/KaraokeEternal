import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class Login extends Component {

  render () {
    let roomOpts = this.props.rooms.map(function (room, i) {
      return (
        <option key={room.roomId} value={room.roomId}>{room.name}</option>
      )
    }, this)

    return (
      <form>
        <input type='email' ref='email' placeholder='email' autoFocus />
        <input type='password' ref='password' placeholder='password' />
        <br />
        <label>Room</label>
        <select ref='room'>{roomOpts}</select>
        <br />

        <button onClick={this.handleClick} className='button wide green raised'>
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
  rooms: PropTypes.array.isRequired,
  onSubmitClick: PropTypes.func.isRequired,
}
