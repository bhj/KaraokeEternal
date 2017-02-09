import React, { PropTypes } from 'react'
import Header from 'components/Header'
import Navigation from 'components/Navigation'
import { SkyLightStateless } from 'react-skylight'
import classes from './AppLayout.css'

export const AppLayout = (props) => (
  <div>
    <div className={classes.header}>
      <Header
        viewComponent={props.header}
        isAdmin={props.isAdmin}
        onHeight={props.setHeaderHeight}
      />
    </div>

    <div className={classes.viewport} style={{width: props.browserWidth, height: props.browserHeight}}>
      {props.children({
        width: props.browserWidth,
        height: props.browserHeight,
        paddingTop: props.headerHeight,
        paddingBottom: props.footerHeight,
      })}
    </div>

    <div className={classes.nav}>
      <Navigation onHeight={props.setFooterHeight}/>
    </div>

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

AppLayout.propTypes = {
  isAdmin: PropTypes.bool,
  errorMessage: PropTypes.string,
  browserWidth: PropTypes.number,
  browserHeight: PropTypes.number,
  headerHeight: PropTypes.number,
  footerHeight: PropTypes.number,
  // actions
  setHeaderHeight: PropTypes.func,
  setFooterHeight: PropTypes.func,
  clearErrorMessage: PropTypes.func,
}

export default AppLayout
