import PropTypes from 'prop-types'
import React, { Component } from 'react'
import RoomSelect from '../../Account/RoomSelect'
import './LoginForm.css'

export default class LoginForm extends Component {
  static propTypes = {
    onSubmitClick: PropTypes.func.isRequired,
  }

  username = React.createRef()
  password = React.createRef()
  handleRoomSelectRef = r => { this.roomSelect = r }

  render () {
    return (
      <form>
        <input type='text'
          placeholder='username or email'
          autoFocus
          ref={this.username}
        />
        <input type='password'
          placeholder='password'
          ref={this.password}
        />
        <RoomSelect onRef={this.handleRoomSelectRef} />

        <br />

        <button onClick={this.handleSubmit} className='primary'>
          Sign in
        </button>
      </form>
    )
  }

  handleSubmit = e => {
    e.preventDefault()

    this.props.onSubmitClick({
      username: this.username.current.value.trim(),
      password: this.password.current.value,
      roomId: this.roomSelect.value,
    })
  }
}
