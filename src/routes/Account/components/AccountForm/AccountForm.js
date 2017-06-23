import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class AccountForm extends Component {
  static propTypes = {
    user: PropTypes.object,
    mode: PropTypes.string.isRequired,
    rooms: PropTypes.object.isRequired,
    isFirstRun: PropTypes.bool.isRequired,
    createUser: PropTypes.func.isRequired,
    updateUser: PropTypes.func.isRequired,
  }

  state = {
    name: this.props.user ? this.props.user.name : '',
    email: this.props.user ? this.props.user.email : '',
  }

  render () {
    const { mode, isFirstRun, rooms } = this.props

    let roomOpts = rooms.result.map(roomId => {
      const room = rooms.entities[roomId]

      return (
        <option key={roomId} value={roomId}>{room.name}</option>
      )
    })

    return (
      <form>
        <input type='text' ref='name' placeholder='name (visible to others)'
          value={this.state.name || ''}
          onChange={this.handleNameChange}
          autoFocus={mode === 'create'}
        />
        <input type='email' ref='email' placeholder='email (private)'
          value={this.state.email || ''}
          onChange={this.handleEmailChange}
          autoFocus={mode === 'edit'}
        />

        <input type='password' ref='newPassword'
          placeholder={mode === 'create' ? 'password' : 'new password (optional)'}
        />
        <input type='password' ref='newPasswordConfirm'
          placeholder={mode === 'create' ? 'confirm password' : 'new password confirm'}
        />

        {mode === 'update' &&
          <input type='password' ref='curPassword' placeholder='current password' />
        }

        {mode === 'create' && !isFirstRun &&
          <label>Choose Room
            <select ref='room'>{roomOpts}</select>
          </label>
        }

        <br />
        <button onClick={this.handleClick} className='button wide green raised'>
          {mode === 'create' ? 'Create Account' : 'Update Account'}
        </button>
      </form>
    )
  }

  handleChange = (inputName, event) => {
    this.setState({ [inputName]: event.target.value })
  }

  handleNameChange = this.handleChange.bind(this, 'name')
  handleEmailChange = this.handleChange.bind(this, 'email')

  handleClick = (event) => {
    event.preventDefault()
    const { name, email, newPassword, newPasswordConfirm, curPassword } = this.refs
    const user = {
      name: name.value.trim(),
      email: email.value.trim(),
      password: curPassword ? curPassword.value : null,
      newPassword: newPassword.value,
      newPasswordConfirm: newPasswordConfirm.value
    }

    if (this.props.mode === 'update') {
      this.props.updateUser(user)
    } else {
      if (!this.props.isFirstRun) {
        user.roomId = parseInt(this.refs.room.value, 10)
      }

      this.props.createUser(user)
    }
  }
}
