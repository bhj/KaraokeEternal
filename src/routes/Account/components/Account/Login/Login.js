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
        <RoomSelect onRef={this.handleRoomSelectRef} />

        <br />
        <button onClick={this.handleSubmit} className='primary'>
          Sign In
        </button>
      </form>
    )
  }

  handleRoomSelectRef = r => {
    this.roomSelect = r
  }

  handleSubmit = (e) => {
    e.preventDefault()

    this.props.onSubmitClick({
      username: this.username.value.trim(),
      password: this.password.value,
      roomId: this.roomSelect.value,
    })
  }
}
