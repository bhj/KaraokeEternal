import React, { PropTypes } from 'react'
import Navigation from 'layouts/Navigation'
import { SkyLightStateless } from 'react-skylight'
import classes from './AppLayout.css'

const AppLayout = (props) => {
  const viewportStyle = {
    width: props.viewportWidth,
    height: props.viewportHeight,
    paddingTop: props.headerHeight,
    paddingBottom: props.footerHeight,
    overflowY: 'scroll',
  }

  return (
    <div>
      {props.children(viewportStyle)}

      <Navigation/>

      <SkyLightStateless
        isVisible={props.errorMessage !== null}
        onCloseClicked={props.clearErrorMessage}
        onOverlayClicked={props.clearErrorMessage}
        title="Oops"
        dialogStyles={{
          width: '80%',
          height: 'auto',
          left: '10%',
          marginLeft: '0'}}
      >
        <p>{props.errorMessage}</p>
        <br/><br/><br/>
        <button className="button wide raised" onClick={props.clearErrorMessage}>Dismiss</button>
      </SkyLightStateless>
    </div>
  )
}

AppLayout.propTypes = {
  viewportWidth: PropTypes.number.isRequired,
  viewportHeight: PropTypes.number.isRequired,
  headerHeight: PropTypes.number.isRequired,
  footerHeight: PropTypes.number.isRequired,
  errorMessage: PropTypes.any,
  // actions
  clearErrorMessage: PropTypes.func,
}

export default AppLayout
