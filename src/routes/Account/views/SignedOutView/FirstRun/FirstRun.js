import React, { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AccountForm from '../../../components/AccountForm'
import { createAccount } from 'store/modules/user'
import './FirstRun.css'

const FirstRun = props => {
  const user = useSelector(state => state.user)
  const formRef = useRef(null)

  const dispatch = useDispatch()
  const handleCreate = useCallback(() => {
    dispatch(createAccount(formRef.current.getData()))
  }, [dispatch])

  return (
    <>
      <div styleName='heading'>
        <h2>Welcome</h2>
        <p>Create your <b>admin</b> account to get started. All data is locally stored and never shared.</p>
      </div>

      <AccountForm user={user} ref={formRef}/>

      <button onClick={handleCreate} className='primary'>
        Create Account
      </button>
    </>
  )
}

export default FirstRun
