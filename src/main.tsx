import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import store from './store/store'
import socket from 'lib/socket'
import { connectSocket } from './store/modules/user'
import Persistor from 'store/Persistor'
import App from './components/App'

const basename = new URL(document.baseURI).pathname

const persistor = Persistor.init(store, () => {
  // rehydration complete; open socket connection
  // if it looks like we have a valid session
  if (store.getState().user.userId !== null) {
    store.dispatch(connectSocket())
    socket.open()
  }
})

socket.on('reconnect_attempt', () => {
  store.dispatch(connectSocket())
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
  { path: '*', element: <App store={store} persistor={persistor} /> }
], { basename })

root.render(
  <React.StrictMode>
    <RouterProvider router={window._router } />
  </React.StrictMode>
)
