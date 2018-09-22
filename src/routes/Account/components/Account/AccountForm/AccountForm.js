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
        <input type='text' placeholder='name (public)'
          value={this.state.name}
          onChange={this.handleNameChange}
          autoFocus={!isLoggedIn}
          ref={r => { this.name = r }}
        />
        <input type='text' placeholder='username or email (private)'
          value={this.state.username}
          onChange={this.handleUsernameChange}
          ref={r => { this.username = r }}
        />
        <input type='password' placeholder={isLoggedIn ? 'new password (optional)' : 'password'}
          ref={r => { this.newPassword = r }}
        />
        <input type='password'
          placeholder={isLoggedIn ? 'new password confirm' : 'confirm password'}
          ref={r => { this.newPasswordConfirm = r }}
        />

        {isLoggedIn &&
          <input type='password' placeholder='current password'
            style={{ marginBottom: 0 }}
            ref={r => { this.curPassword = r }}
          />
        }

        {showRoom &&
          <RoomSelect onRef={this.handleRoomSelectRef} />
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
  handleRoomSelectRef = r => {
    this.roomSelect = r
  }

  handleSubmit = (event) => {
    event.preventDefault()

    const data = {
      name: this.name.value.trim(),
      username: this.username.value.trim(),
      password: this.curPassword ? this.curPassword.value : null,
      newPassword: this.newPassword.value,
      newPasswordConfirm: this.newPasswordConfirm.value
    }

    if (this.props.showRoom) {
      data.roomId = this.roomSelect.value
    }

    this.props.isLoggedIn ? this.props.updateUser(data) : this.props.createUser(data)
  }
}
