import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import EditUser from './EditUser'
import { formatDateTime } from 'lib/dateTime'
import { closeUserEditor, fetchUsers, filterByOnline, filterByRoom, openUserEditor } from '../../modules/users'
import getUsers from '../../selectors/getUsers'
import styles from './Users.css'

const Users = props => {
  const [editorUser, setEditorUser] = useState(null)

  const curUserId = useSelector(state => state.user.userId)
  const { isEditorOpen, filterOnline, filterRoomId } = useSelector(state => state.users)
  const rooms = useSelector(state => state.rooms)
  const users = useSelector(getUsers)

  const dispatch = useDispatch()
  const handleClose = useCallback(() => dispatch(closeUserEditor()), [dispatch])
  const handleFilterChange = useCallback(e => {
    if (e.target.value === 'all') dispatch(filterByOnline(false))
    else if (e.target.value === 'online') dispatch(filterByOnline(true))
    else dispatch(filterByRoom(parseInt(e.target.value, 10)))
  }, [dispatch])
  const handleOpen = useCallback(e => {
    setEditorUser(users.entities[e.target.dataset.userId])
    dispatch(openUserEditor())
  }, [dispatch, users])

  // once per mount
  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

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

  const roomOpts = rooms.result
    .filter(roomId => !!rooms.entities[roomId].numUsers)
    .map(roomId => <option key={roomId} value={roomId}>{rooms.entities[roomId].name}</option>)

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Users</h1>
        <select onChange={handleFilterChange} value={filterOnline ? 'online' : filterRoomId || 'all'}>
          <option key='all' value={'all'}>All</option>
          <option key='online' value={'online'}>Online</option>
          <optgroup label='Online in...'>
            {roomOpts}
          </optgroup>
        </select>
      </div>
      <div className={styles.content}>
        <table className={styles.table}>
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
