import React, { Component, PropTypes } from 'react'

export default class AccountForm extends Component {

  static propTypes = {
    onSubmitClick: PropTypes.func.isRequired,
    errorMessage: PropTypes.string
  }

  // initial state
  state = {
    name: this.props.defaultName,
    email: this.props.defaultEmail
  }

  handleChange(inputName) {
    return (event) => this.setState({[inputName]: event.target.value})
  }

  render() {
    return (
      <form>
        <input type='text' ref='name' value={this.state.name} onChange={this.handleChange('name')} className="form-control" placeholder='display name' autoFocus={this.props.viewMode === 'create'}/>
        <input type='text' ref='email' value={this.state.email} onChange={this.handleChange('email')} className="form-control" placeholder='email'/>

        <input type='password' ref='newPassword' className="form-control" placeholder={this.props.viewMode === 'create' ? 'password' : 'new password'}/>
        <input type='password' ref='newPasswordConfirm' className="form-control" placeholder={this.props.viewMode === 'create' ? 'confirm password' : 'confirm new password'}/>

        {this.props.viewMode === 'edit' &&
          <input type='password' ref='curPassword' className="form-control" placeholder='current password'/>
        }

        <button onClick={(event) => this.handleClick(event)} className="btn btn-primary">
          {this.props.viewMode === 'create' ? 'Create Account' : 'Update Account'}
        </button>
      </form>
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

    this.props.onSubmitClick(user)
  }
}
