import React, { Component, PropTypes } from 'react'
import classes from './AccountForm.css'
import Login from '../Login'
import Logout from '../Logout'

export default class AccountForm extends Component {
  static propTypes = {
    user: PropTypes.object,
    rooms: PropTypes.array,
    viewMode: PropTypes.string.isRequired,
    loginUser: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
    updateUser: PropTypes.func.isRequired,
    changeView: PropTypes.func.isRequired
  }

  state = {
    name: this.props.user ? this.props.user.name : '',
    email: this.props.user ? this.props.user.email : ''
  }

  handleChange = (inputName) => {
    return (event) => this.setState({[inputName]: event.target.value})
  }

  render() {
    const viewMode = this.props.user ? 'edit' : this.props.viewMode

    return (
      <div className={classes.section}>
        {viewMode === 'login' &&
          <div>
            <p>Sign in below or <a onClick={() => this.props.changeView('create')}>create a new account</a>.</p>
            <Login onSubmitClick={this.props.loginUser} rooms={this.props.rooms}/>
          </div>
        }
        {viewMode === 'create' &&
          <p>Create an account or <a onClick={() => this.props.changeView('login')}>sign in with an existing one</a>.</p>
        }
        {viewMode === 'edit' &&
          <h2>Update Account</h2>
        }

        {viewMode !== 'login' &&
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
      </div>
    )
  }

  handleClick = (event) => {
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
}
