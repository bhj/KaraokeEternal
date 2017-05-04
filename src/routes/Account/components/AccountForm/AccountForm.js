import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Login from '../Login'

export default class AccountForm extends Component {
  static propTypes = {
    user: PropTypes.object,
    loginUser: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
    updateUser: PropTypes.func.isRequired,
  }

  state = {
    name: this.props.user ? this.props.user.name : '',
    email: this.props.user ? this.props.user.email : '',
    view: 'login',
  }

  handleChange = (inputName, event) => {
    this.setState({ [inputName]: event.target.value })
  }

  handleNameChange = this.handleChange.bind(this, 'name')
  handleEmailChange = this.handleChange.bind(this, 'email')

  viewLogin = () => this.setState({ view: 'login' })
  viewCreate = () => this.setState({ view: 'create' })

  render () {
    const { user } = this.props
    const view = this.props.user.userId !== null ? 'edit' : this.state.view

    return (
      <div>
        {view === 'login' &&
          <div>
            <p>Sign in below or <a onClick={this.viewCreate}>create a new account</a>.</p>
            <Login onSubmitClick={this.props.loginUser} rooms={user.rooms} />
          </div>
        }
        {view === 'create' &&
          <p>Create an account or <a onClick={this.viewLogin}>sign in with an existing one</a>.</p>
        }
        {view === 'edit' &&
          <h2>Update Account</h2>
        }

        {view !== 'login' &&
          <form>
            <input type='text' ref='name' placeholder='display name'
              value={this.state.name || ''}
              onChange={this.handleNameChange}
              autoFocus={view === 'create'}
            />
            <input type='email' ref='email' placeholder='email'
              value={this.state.email || ''}
              onChange={this.handleEmailChange}
              autoFocus={view === 'login'}
            />

            <input type='password' ref='newPassword'
              placeholder={view === 'create' ? 'password' : 'new password'}
            />
            <input type='password' ref='newPasswordConfirm'
              placeholder={view === 'create' ? 'confirm password' : 'confirm new password'}
            />

            {view === 'edit' &&
              <input type='password' ref='curPassword' placeholder='current password' />
            }

            <br />
            <button onClick={this.handleClick} className='button wide green raised'>
              {view === 'create' ? 'Create Account' : 'Update Account'}
            </button>
          </form>
        }
      </div>
    )
  }

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

    if (this.props.user) {
      this.props.updateUser(user)
    } else {
      this.props.createUser(user)
    }
  }
}
