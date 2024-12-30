import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from 'components/App/App'

const basename = new URL(document.baseURI).pathname

const AppRouter = createBrowserRouter([
  // https://github.com/remix-run/react-router/issues/9422#issuecomment-1302564759
  { path: '*', element: <App /> },
], { basename })

export default AppRouter
