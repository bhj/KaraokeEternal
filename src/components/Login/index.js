import React, { Component, PropTypes } from 'react'

export default class Login extends Component {

  render() {
    return (
      <form>
        <input type='text' ref='email' className="form-control" style={{ marginRight: '5px' }} placeholder='email' autoFocus/>
        <input type='password' ref='password' className="form-control" style={{ marginRight: '5px' }} placeholder='password'/>
        <button onClick={(event) => this.handleClick(event)} className="btn btn-primary">
          Sign In
        </button>
      </form>
    )
  }

  handleClick(event) {
    event.preventDefault()
    const creds = { email: this.refs.email.value, password: this.refs.password.value }
    this.props.onSubmitClick(creds)
  }
}

Login.propTypes = {
  onSubmitClick: PropTypes.func.isRequired,
}
