import React, { Component, PropTypes } from 'react'

export default class Login extends Component {

  render() {
    const { errorMessage } = this.props

    return (
      <form>
        <input type='text' ref='email' className="form-control" style={{ marginRight: '5px' }} placeholder='email' autoFocus/>
        <input type='password' ref='password' className="form-control" style={{ marginRight: '5px' }} placeholder='password'/>
        <button onClick={(event) => this.handleClick(event)} className="btn btn-primary">
          Sign In
        </button>

        {errorMessage &&
          <p style={{color:'red'}}>{errorMessage}</p>
        }
      </form>
    )
  }

  handleClick(event) {
    event.preventDefault()
    const email = this.refs.email
    const password = this.refs.password
    const creds = { email: email.value.trim(), password: password.value.trim() }
    this.props.onLoginClick(creds)
  }
}

Login.propTypes = {
  onLoginClick: PropTypes.func.isRequired,
  errorMessage: PropTypes.string
}
