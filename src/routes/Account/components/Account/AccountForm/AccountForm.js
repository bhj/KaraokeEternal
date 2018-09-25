import PropTypes from 'prop-types'
import React, { Component } from 'react'
import RoomSelect from '../RoomSelect'
import './AccountForm.css'

export default class AccountForm extends Component {
  static propTypes = {
    user: PropTypes.any,
    showRoom: PropTypes.bool.isRequired,
    onSubmitClick: PropTypes.func.isRequired,
  }

  state = {
    showConfirmPassword: !this.props.user,
    showCurrentPassword: false,
  }

  handleRoomSelectRef = r => { this.roomSelect = r }

  render () {
    const { user, showRoom } = this.props

    return (
      <form>
        <input type='text'
          autoFocus={!user}
          defaultValue={user ? user.username : ''}
          onChange={this.updateVisible}
          placeholder={user ? 'new username or email' : 'username or email'}
          ref={r => { this.username = r }}
        />

        <input type='password'
          onChange={this.updateVisible}
          placeholder={user ? 'new password (optional)' : 'password'}
          ref={r => { this.newPassword = r }}
        />

        {this.state.showConfirmPassword &&
          <input type='password'
            placeholder={user ? 'new password confirm' : 'confirm password'}
            ref={r => { this.newPasswordConfirm = r }}
          />
        }

        <br />
        <input type='text'
          defaultValue={user ? user.name : ''}
          onChange={this.updateVisible}
          placeholder='name (public)'
          ref={r => { this.name = r }}
        />

        {this.state.showCurrentPassword &&
          <>
            <br />
            <input type='password'
              placeholder='current password'
              ref={r => { this.curPassword = r }}
              style={{ marginBottom: 0 }}
            />
          </>
        }

        {showRoom &&
          <RoomSelect onRef={this.handleRoomSelectRef} />
        }

        <br />
        <button onClick={this.handleSubmit} className='primary'>
          {user ? 'Update Account' : 'Create Account'}
        </button>
      </form>
    )
  }

  handleSubmit = (event) => {
    event.preventDefault()

    const data = {
      name: this.name.value.trim(),
      username: this.username.value.trim(),
      password: this.curPassword ? this.curPassword.value : null,
      newPassword: this.newPassword ? this.newPassword.value : null,
      newPasswordConfirm: this.newPasswordConfirm ? this.newPasswordConfirm.value : null,
    }

    if (this.roomSelect) {
      data.roomId = this.roomSelect.value
    }

    this.props.onSubmitClick(data)
  }

  updateVisible = () => {
    if (!this.props.user) return

    this.setState({
      showConfirmPassword: !!this.newPassword.value,
      showCurrentPassword: !!this.newPassword.value ||
        this.username.value !== this.props.user.username ||
        this.name.value !== this.props.user.name,
    })
  }
}
