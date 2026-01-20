import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import store from './store/store'
import socket from 'lib/socket'
import AppRouter from 'lib/AppRouter'
import { checkSession, connectSocket } from './store/modules/user'

// ALWAYS validate session against server - SSO is the source of truth
// This ensures the keToken cookie is set correctly before socket connects
store.dispatch(checkSession())

socket.on('reconnect_attempt', () => {
  store.dispatch(connectSocket())
})

// ========================================================
// Go!
// ========================================================
createRoot(document.getElementById('root'))
  .render(
    <React.StrictMode>
      <RouterProvider router={AppRouter} />
    </React.StrictMode>,
  )
