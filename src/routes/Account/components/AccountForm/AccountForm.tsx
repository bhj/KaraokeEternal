import React, { Component } from 'react'
import UserImage from './UserImage/UserImage'
import { User } from 'shared/types'
import styles from './AccountForm.css'

interface AccountFormProps {
  children?: React.ReactNode
  onDirtyChange?(...args: unknown[]): unknown
  onSubmit(...args: unknown[]): unknown
  requirePassword?: boolean
  showRole?: boolean
  user?: User
}

export default class AccountForm extends Component<AccountFormProps> {
  username = null
  newPassword = null
  newPasswordConfirm = null
  name = null
  role = null

  state = {
    isDirty: false,
    isChangingPassword: !this.props.user || this.props.user.userId === null,
    userImage: undefined,
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.user && prevProps.user.dateUpdated !== this.props.user.dateUpdated) {
      this.setState({ isDirty: false })
    }

    if (this.props.onDirtyChange && prevState.isDirty !== this.state.isDirty) {
      this.props.onDirtyChange(this.state.isDirty)
    }
  }

  render () {
    const isUser = this.props.user && this.props.user.userId !== null

    return (
      <form
        className={styles.container}
        key={this.props.user?.dateUpdated}
        noValidate
        onSubmit={this.handleSubmit}
      >
        <input
          type='email'
          autoComplete='off'
          autoFocus={!isUser}
          onChange={this.updateDirty}
          placeholder={isUser ? 'change username (optional)' : 'username or email'}
          ref={(r) => { this.username = r }}
          className={styles.field}
        />

        <input
          type='password'
          autoComplete='new-password'
          onChange={this.updateDirty}
          placeholder={isUser ? 'change password (optional)' : 'password'}
          ref={(r) => { this.newPassword = r }}
          className={styles.field}
        />

        {this.state.isChangingPassword
        && (
          <input
            type='password'
            autoComplete='new-password'
            placeholder={isUser ? 'new password confirm' : 'confirm password'}
            ref={(r) => { this.newPasswordConfirm = r }}
            className={styles.field}
          />
        )}

        <div className={styles.userDisplayContainer}>
          <UserImage
            user={this.props.user}
            onSelect={this.handleUserImageChange}
          />
          <input
            type='text'
            defaultValue={isUser ? this.props.user.name : ''}
            onChange={this.updateDirty}
            placeholder='display name'
            ref={(r) => { this.name = r }}
            className={`${styles.field} ${styles.name}`}
          />
        </div>

        {this.props.showRole
        && (
          <select
            defaultValue={isUser && this.props.user.isAdmin ? '1' : '0'}
            onChange={this.updateDirty}
            ref={(r) => { this.role = r }}
            className={styles.field}
          >
            <option key='choose' value='' disabled>select role...</option>
            <option key='std' value='0'>Standard</option>
            <option key='admin' value='1'>Administrator</option>
          </select>
        )}

        {this.props.children}
      </form>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const data = new FormData()

    if (this.name.value.trim()) {
      data.append('name', this.name.value.trim())
    }

    if (this.username.value.trim()) {
      data.append('username', this.username.value.trim())
    }

    if (this.state.isChangingPassword) {
      data.append('newPassword', this.newPassword.value)
      data.append('newPasswordConfirm', this.newPasswordConfirm.value)
    }

    if (typeof this.state.userImage !== 'undefined') {
      data.append('image', this.state.userImage)
    }

    if (this.role) {
      data.append('role', this.role.value)
    }

    this.props.onSubmit(data)
  }

  handleUserImageChange = (blob) => {
    this.setState({
      userImage: blob,
      isDirty: true,
    })
  }

  updateDirty = () => {
    if (!this.props.user || this.props.user.userId === null) return

    this.setState({
      isDirty: !!this.username.value || !!this.newPassword.value
        || this.name.value !== this.props.user.name
        || (this.role && this.role.value !== (this.props.user.isAdmin ? '1' : '0')),
      isChangingPassword: !!this.newPassword.value,
    })
  }
}
