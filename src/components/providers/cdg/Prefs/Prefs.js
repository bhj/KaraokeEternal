import React from 'react'

export default class Prefs extends React.Component {
  static propTypes = {
    prefs: React.PropTypes.object.isRequired,
    setPrefs: React.PropTypes.func.isRequired,
  }

  toggleEnabled = this.toggleEnabled.bind(this)

  toggleEnabled() {
    let prefs = Object.assign({}, this.props.prefs)
    prefs.enabled = !prefs.enabled
    this.props.setPrefs('provider.cdg', prefs)
  }

  render() {
    const { prefs } = this.props

    return (
      <div >
        <form>
          <label>
            <input type='checkbox' defaultChecked={prefs.enabled} onClick={this.toggleEnabled}/>
            CD+Graphics (audio with .cdg file)
          </label>
        </form>
      </div>
    )
  }

  handleRefresh() {
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
