import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import EditUser from './EditUser'
import { formatDateTime } from 'lib/dateTime'
import { closeUserEditor, fetchUsers, openUserEditor } from '../../modules/users'
import getUsers from '../../selectors/getUsers'
import './Users.css'

const Users = props => {
  const [editorUser, setEditorUser] = useState(null)

  const curUserId = useSelector(state => state.user.userId)
  const { isEditorOpen, isShowingAll } = useSelector(state => state.users)
  const users = useSelector(getUsers)

  const dispatch = useDispatch()
  const handleClose = useCallback(() => dispatch(closeUserEditor()), [dispatch])
  const handleOpen = useCallback(e => {
    setEditorUser(users.entities[e.target.dataset.userId])
    dispatch(openUserEditor())
  }, [dispatch, users])

  useEffect(() => {
    dispatch(fetchUsers())
  }, []) // once per mount

  const rows = users.result.map(userId => {
    const user = users.entities[userId]
    return (
      <tr key={userId}>
        {userId === curUserId &&
          <td><strong>{user.username}</strong> ({user.name})</td>
        }
        {userId !== curUserId &&
          <td><a data-user-id={userId} onClick={handleOpen}>{user.username}</a> ({user.name})</td>
        }
        <td>{user.isAdmin ? 'admin' : 'standard'}</td>
        <td>{formatDateTime(new Date(user.dateCreated * 1000))}</td>
      </tr>
    )
  })

  return (
    <div styleName='container'>
      <div styleName='titleContainer'>
        <h1 styleName='title'>Users</h1>
      </div>
      <div styleName='content'>
        <table styleName='table'>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>

        <br />
        <button onClick={handleOpen} className='primary'>
          Create User
        </button>

        <EditUser isVisible={isEditorOpen} onClose={handleClose} user={editorUser} />
      </div>
    </div>
  )
}

export default Users
