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
    email: this.props.user ? this.props.user.email : '',
  }

  render () {
    const { user, requireRoom } = this.props

    return (
      <div>
        <input type='text' ref='name' placeholder='name (visible to others)'
          value={this.state.name}
          onChange={this.handleNameChange}
          autoFocus={!user}
        />
        <input type='email' ref='email' placeholder='email (private)'
          value={this.state.email}
          onChange={this.handleEmailChange}
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
        <button onClick={this.handleClick}>
          {user ? 'Update Account' : 'Create Account'}
        </button>
      </div>
    )
  }

  handleChange = (inputName, event) => {
    this.setState({ [inputName]: event.target.value })
  }
  handleNameChange = this.handleChange.bind(this, 'name')
  handleEmailChange = this.handleChange.bind(this, 'email')
  handleRoomSelect = (roomId) => {
    this.roomId = roomId
  }

  handleClick = (event) => {
    event.preventDefault()
    const { name, email, newPassword, newPasswordConfirm, curPassword } = this.refs
    const data = {
      name: name.value.trim(),
      email: email.value.trim(),
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
