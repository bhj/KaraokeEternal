import PropTypes from 'prop-types'
import React from 'react'
import { Redirect, Route, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ children, path, redirect, ...rest }) => {
  const isAuthenticated = useSelector(state => state.user.userId !== null)
  const location = useLocation()

  if (!isAuthenticated) {
    // set their originally-desired location in query parameter
    const params = new URLSearchParams(location.search)
    params.set('redirect', path)

    return <Redirect to={redirect + '?' + params.toString() }/>
  }

  return <Route {...rest}>{children}</Route>
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  path: PropTypes.string.isRequired,
  redirect: PropTypes.string.isRequired,
}

export default ProtectedRoute
