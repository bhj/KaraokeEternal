import React, { Component, PropTypes } from 'react'
import Login from './Login'
import Logout from './Logout'

export default class AccountForm extends Component {
  static propTypes = {
    user: PropTypes.object,
    rooms: PropTypes.array,
    loginUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
    updateUser: PropTypes.func.isRequired,
    changeView: PropTypes.func.isRequired
  }

  handleClick = this.handleClick.bind(this)
  handleLogout = this.handleLogout.bind(this)

  // initial state
  state = {
    name: this.props.defaultName,
    email: this.props.defaultEmail
  }

  handleChange(inputName) {
    return (event) => this.setState({[inputName]: event.target.value})
  }

  render() {
    const { user, viewMode } = this.props

    return (
      <div>
        {!user && viewMode === 'login' &&
          <div>
            <p>Sign in below or <a onClick={() => this.props.changeView('create')}>create a new account</a>.</p>
            <Login onSubmitClick={this.props.loginUser} rooms={this.props.rooms}/>
          </div>
        }
        {viewMode === 'create' &&
          <p>Create an account or <a onClick={() => this.props.changeView('login')}>sign in with an existing one</a>.</p>
        }
        {viewMode === 'edit' &&
          <p>You may edit any account information here.</p>
        }

        {(viewMode === 'create' || user) &&
          <form>
            <input type='text' ref='name' value={this.state.name} onChange={this.handleChange('name')} autoFocus={viewMode === 'create'} placeholder='display name'/>
            <input type='email' ref='email' value={this.state.email} onChange={this.handleChange('email')} placeholder='email'/>

            <input type='password' ref='newPassword' placeholder={viewMode === 'create' ? 'password' : 'new password'}/>
            <input type='password' ref='newPasswordConfirm' placeholder={viewMode === 'create' ? 'confirm password' : 'confirm new password'}/>

            {viewMode === 'edit' &&
              <input type='password' ref='curPassword' placeholder='current password'/>
            }

            <br/>
            <button onClick={this.handleClick} className="button wide green raised">
              {viewMode === 'create' ? 'Create Account' : 'Update Account'}
            </button>
          </form>
        }

        {user &&
          <Logout onLogoutClick={this.handleLogout} />
        }
      </div>
    )
  }

  handleClick(event) {
    event.preventDefault()
    const name = this.refs.name
    const email = this.refs.email
    const newPassword = this.refs.newPassword
    const newPasswordConfirm = this.refs.newPasswordConfirm
    const curPassword = this.refs.curPassword

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

  handleLogout() {
    this.props.logoutUser()
  }
}
