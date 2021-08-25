import React from 'react'
import ReactDOM from 'react-dom'
import createStore from './store/createStore'
import App from './components/App'
import { persistStore } from 'redux-persist'
import io from 'socket.io-client'
import { connectSocket } from './store/modules/user'
import { toast } from 'react-toastify'

// the "socket" side of the api requires authentication, so
// we only want to attempt socket connection if we think we
// have a valid session (via JWT in cookie). the socket.io
// handshake (http) will then include the JWT/cookie
window._socket = io({ autoConnect: false })

window._socket.on('reconnect_attempt', () => {
  store.dispatch(connectSocket())
})

// toast functionality...
// TODO: If a user isn't around when a toast comes in, it's possible they'll miss it.
//  Might want to add a mechanism to save notifications to the DB and send recent ones to the user when they login.
//  The toasts currently aren't all that vital, though, so probably more trouble than it's worth atm.
window._socket.on('toast', (data) => {
  const defaultOptions = {
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  }

  const content = data.content
  delete data.content

  // don't show the toast on the player...
  const isPlayer = window.location.pathname.replace(/\/$/, '').endsWith('/player')
  if (!isPlayer) {
    toast(content, { ...defaultOptions, ...data })
  }
})

// ========================================================
// Store Instantiation
// ========================================================
const initialState = window.__INITIAL_STATE__
const store = createStore(initialState)

window._persistor = persistStore(store, null, () => {
  // rehydration complete; open socket connection
  // if it looks like we have a valid session
  if (store.getState().user.userId !== null) {
    store.dispatch(connectSocket())
    window._socket.open()
  }
})

// ========================================================
// Go!
// ========================================================
const MOUNT_NODE = document.getElementById('root')

ReactDOM.render(
  <App store={store} persistor={window._persistor} />,
  MOUNT_NODE
)
