import React from 'react'
import { createRoot } from 'react-dom/client'
import createStore from './store/createStore'
import App from './components/App'
import { persistStore } from 'redux-persist'
import io from 'socket.io-client'
import { connectSocket } from './store/modules/user'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const basename = new URL(document.baseURI).pathname

// the "socket" side of the api requires authentication, so
// we only want to attempt socket connection if we think we
// have a valid session (via JWT in cookie). the socket.io
// handshake (http) will then include the JWT/cookie
window._socket = io({
  autoConnect: false,
  path: new URL(document.baseURI).pathname + 'socket.io',
})

window._socket.on('reconnect_attempt', () => {
  store.dispatch(connectSocket())
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
const root = createRoot(MOUNT_NODE)

// see https://github.com/remix-run/react-router/issues/9422#issuecomment-1302564759
// also, we could make this a 'router' module that can be imported elsewhere to
// call router.navigate(), but for now, storing on window for simplicity
window._router = createBrowserRouter([
  { path: '*', element: <App store={store} persistor={window._persistor} /> }
], { basename })

root.render(
  <React.StrictMode>
    <RouterProvider router={window._router } />
  </React.StrictMode>
)
