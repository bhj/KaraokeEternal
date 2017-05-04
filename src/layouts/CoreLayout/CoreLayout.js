import PropTypes from 'prop-types'
import React from 'react'
import Navigation from 'components/Navigation'
import { SkyLightStateless } from 'react-skylight'
// global styles should be imported early to ensure
// they appear before styles imported by components
import 'normalize.css'
import '../../styles/globalStyle.css'

export const CoreLayout = (props) => {
  const viewportStyle = {
    width: props.viewportWidth,
    height: props.viewportHeight,
    paddingTop: props.headerHeight,
    paddingBottom: props.footerHeight,
    // overflowY: 'scroll',
    // WebkitOverflowScrolling: 'touch',
  }

  return (
    <div>
      { React.cloneElement(props.children, { viewportStyle }) }

      <Navigation />

      <SkyLightStateless
        isVisible={props.errorMessage !== null}
        onCloseClicked={props.clearErrorMessage}
        onOverlayClicked={props.clearErrorMessage}
        title='Oops'
        dialogStyles={{
          width: '80%',
          height: 'auto',
          left: '10%',
          marginLeft: '0' }}
      >
        <p>{props.errorMessage}</p>
        <br /><br /><br />
        <button className='button wide raised' onClick={props.clearErrorMessage}>Dismiss</button>
      </SkyLightStateless>
    </div>
  )
}

export default CoreLayout

CoreLayout.propTypes = {
  children: PropTypes.any,
  viewportWidth: PropTypes.number.isRequired,
  viewportHeight: PropTypes.number.isRequired,
  headerHeight: PropTypes.number.isRequired,
  footerHeight: PropTypes.number.isRequired,
  errorMessage: PropTypes.any,
  // actions
  clearErrorMessage: PropTypes.func,
}
