import PropTypes from 'prop-types'
import React, { Component } from 'react'
import RoomSelect from '../RoomSelect'

export default class AccountForm extends Component {
  static propTypes = {
    user: PropTypes.object,
    requireRoom: PropTypes.bool.isRequired,
    // actions
    onSubmitClick: PropTypes.func.isRequired,
  }

  state = {
    name: this.props.user ? this.props.user.name : '',
    username: this.props.user ? this.props.user.username : '',
  }

  render () {
    const { user, requireRoom } = this.props

    return (
      <div>
        <input type='text' ref='name' placeholder='name (public)'
          value={this.state.name}
          onChange={this.handleNameChange}
          autoFocus={!user}
        />
        <input type='text' ref='username' placeholder='email or username (private)'
          value={this.state.username}
          onChange={this.handleUsernameChange}
        />
        <input type='password' ref='newPassword'
          placeholder={user ? 'new password (optional)' : 'password'}
        />
        <input type='password' ref='newPasswordConfirm'
          placeholder={user ? 'new password confirm' : 'confirm password'}
        />

        {user &&
          <input type='password' ref='curPassword' placeholder='current password' />
        }

        {requireRoom &&
          <RoomSelect onRoomSelect={this.handleRoomSelect} />
        }

        <br />
        <button onClick={this.handleClick} className='primary'>
          {user ? 'Update Account' : 'Create Account'}
        </button>
      </div>
    )
  }

  handleChange = (inputName, event) => {
    this.setState({ [inputName]: event.target.value })
  }
  handleNameChange = this.handleChange.bind(this, 'name')
  handleUsernameChange = this.handleChange.bind(this, 'username')
  handleRoomSelect = (roomId) => {
    this.roomId = roomId
  }

  handleClick = (event) => {
    event.preventDefault()
    const { name, username, newPassword, newPasswordConfirm, curPassword } = this.refs
    const data = {
      name: name.value.trim(),
      username: username.value.trim(),
      password: curPassword ? curPassword.value : null,
      newPassword: newPassword.value,
      newPasswordConfirm: newPasswordConfirm.value
    }

    if (this.props.requireRoom) {
      data.roomId = this.roomId
    }

    this.props.onSubmitClick(data)
  }
}
