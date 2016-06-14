import React, { Component, PropTypes } from 'react'

export default class Login extends Component {

  render() {
    let roomOpts = this.props.rooms.map(function(room, i) {
      return (
        <option key={room.id} value={room.id}>{room.name}</option>
      )
    }, this)

    return (
      <form>
        <input type='text' ref='email' placeholder="email" autoFocus={true}/>
        <input type='password' ref='password' placeholder="password"/>
        <br/>
        <label>Room</label>
        <select ref='room'>{roomOpts}</select>
        <br/>

        <button onClick={(event) => this.handleClick(event)} className="button wide green raised">
          Sign In
        </button>
      </form>
    )
  }

  handleClick(event) {
    event.preventDefault()
    const creds = {
      email: this.refs.email.value,
      password: this.refs.password.value,
      roomId: this.refs.room.value
    }

    this.props.onSubmitClick(creds)
  }
}

Login.propTypes = {
  rooms: PropTypes.array.isRequired,
  onSubmitClick: PropTypes.func.isRequired,
}
