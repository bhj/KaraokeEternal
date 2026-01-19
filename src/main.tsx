import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import store from './store/store'
import socket from 'lib/socket'
import AppRouter from 'lib/AppRouter'
import { checkSession, connectSocket, bootstrapComplete } from './store/modules/user'
import Persistor from 'store/Persistor'

Persistor.init(store, () => {
  // rehydration complete
  if (store.getState().user.userId !== null) {
    // local session exists - connect socket directly
    store.dispatch(connectSocket())
    socket.open()
    store.dispatch(bootstrapComplete())
  } else {
    // no local session - check for SSO session (proxy may have set JWT cookie)
    store.dispatch(checkSession())
  }
})

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
