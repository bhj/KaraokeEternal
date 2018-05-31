import PropTypes from 'prop-types'
import React, { Component } from 'react'
import RoomSelect from '../RoomSelect'
import './AccountForm.css'

export default class AccountForm extends Component {
  static propTypes = {
    user: PropTypes.any,
    isLoggedIn: PropTypes.bool.isRequired,
    showRoom: PropTypes.bool.isRequired,
    // actions
    createUser: PropTypes.func.isRequired,
    updateUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
  }

  state = {
    name: this.props.isLoggedIn ? this.props.user.name : '',
    username: this.props.isLoggedIn ? this.props.user.username : '',
  }

  render () {
    const { isLoggedIn, showRoom } = this.props

    return (
      <form>
        <input type='text' ref='name' placeholder='name (public)'
          value={this.state.name}
          onChange={this.handleNameChange}
          autoFocus={!isLoggedIn}
        />
        <input type='text' ref='username' placeholder='username or email (private)'
          value={this.state.username}
          onChange={this.handleUsernameChange}
        />
        <input type='password' ref='newPassword'
          placeholder={isLoggedIn ? 'new password (optional)' : 'password'}
        />
        <input type='password' ref='newPasswordConfirm'
          placeholder={isLoggedIn ? 'new password confirm' : 'confirm password'}
        />

        {isLoggedIn &&
          <input type='password' ref='curPassword' placeholder='current password' style={{ marginBottom: 0 }}/>
        }

        {showRoom &&
          <RoomSelect onRoomSelect={this.handleRoomSelect} />
        }

        <br />
        <button onClick={this.handleSubmit} className='primary'>
          {isLoggedIn ? 'Update Account' : 'Create Account'}
        </button>

        {isLoggedIn &&
          <button onClick={this.props.logoutUser} styleName='signOut'>
            Sign Out
          </button>
        }
      </form>
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

  handleSubmit = (event) => {
    event.preventDefault()
    const { name, username, newPassword, newPasswordConfirm, curPassword } = this.refs
    const data = {
      name: name.value.trim(),
      username: username.value.trim(),
      password: curPassword ? curPassword.value : null,
      newPassword: newPassword.value,
      newPasswordConfirm: newPasswordConfirm.value
    }

    if (this.props.showRoom) {
      data.roomId = this.roomId
    }

    this.props.isLoggedIn ? this.props.updateUser(data) : this.props.createUser(data)
  }
}
