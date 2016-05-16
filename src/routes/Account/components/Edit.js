import React, { Component, PropTypes } from 'react'

export default class Edit extends Component {

  static propTypes = {
    isNew: PropTypes.bool.isRequired,
    onToggleNewClick: PropTypes.func.isRequired,
    onCreateClick: PropTypes.func.isRequired,
    errorMessage: PropTypes.string
  }

  state = {
    name: this.props.name,
    email: this.props.email
  }

  handleChange(inputName) {
    return (event) => this.setState({[inputName]: event.target.value})
  }

  render() {
    const { onToggleNewClick, isNew, errorMessage } = this.props

    return (
      <form>
        {isNew &&
          <p>Create an account or <a onClick={onToggleNewClick}>sign in with an existing one</a>.</p>
        }
        {!isNew &&
          <p>You may update your account information below.</p>
        }

        <input type='text' ref='name' value={this.state.name} onChange={this.handleChange('name')} className="form-control" placeholder='display name' autoFocus={isNew}/>
        <input type='text' ref='email' value={this.state.email} onChange={this.handleChange('email')} className="form-control" placeholder='email'/>

        <input type='password' ref='newPassword' className="form-control" placeholder={isNew ? 'password' : 'new password'}/>
        <input type='password' ref='newPasswordConfirm' className="form-control" placeholder={isNew ? 'confirm password' : 'confirm new password'}/>

        {!isNew &&
          <input type='password' ref='curPassword' className="form-control" placeholder='current password'/>
        }

        <button onClick={(event) => this.handleClick(event)} className="btn btn-primary">
          {isNew ? 'Create Account' : 'Update Account'}
        </button>

        {errorMessage &&
          <p style={{color:'red'}}>{errorMessage}</p>
        }
      </form>
    )
  }

  handleClick(event) {
    event.preventDefault()
    const name = this.refs.name
    const email = this.refs.email
    const newPassword = this.refs.newPassword
    const newPasswordConfirm = this.refs.newPasswordConfirm
    const curPassword = this.refs.curPassword || null

    const user = {
      name: name.value.trim(),
      email: email.value.trim(),
      newPassword: newPassword.value,
      newPasswordConfirm: newPasswordConfirm.value,
     }

    if (this.props.isNew) {
      this.props.onCreateClick(user)
    } else {
      user.curPassword = curPassword.value
//      this.props.onUpdateClick(user)
    }
  }
}
