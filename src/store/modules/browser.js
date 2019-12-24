import { createResponsiveStateReducer } from 'redux-responsive'

export default createResponsiveStateReducer(null, {
  extraFields: state => ({
    width: window.innerWidth,
    height: window.innerHeight,
  })
})
