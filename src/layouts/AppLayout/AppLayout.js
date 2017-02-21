import React, { PropTypes } from 'react'
import Navigation from 'layouts/Navigation'
import { SkyLightStateless } from 'react-skylight'
import classes from './AppLayout.css'

const AppLayout = (props) => {
  const Header = props.header

  return (
    <div>
      <Header/>

      <div className={classes.viewport} style={{
        width: props.browserWidth,
        height: props.browserHeight,
      }}>
        {props.children({
          width: props.browserWidth,
          height: props.browserHeight,
          paddingTop: props.headerHeight,
          paddingBottom: props.footerHeight,
        })}
      </div>

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
  errorMessage: PropTypes.string,
  // actions
  clearErrorMessage: PropTypes.func,
}

export default AppLayout
