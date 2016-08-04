import React from 'react'
import { connect } from 'react-redux'
import Navigation from '../../components/Navigation'
import LibraryView from '../../routes/Library/containers/LibraryContainer'
import classes from './CoreLayout.css'
import '../../styles/core.scss'
import '../../styles/nomodule/material-ui.scss'

const CoreLayout = (props) => {
  let showLibrary = props.routerPath === '/library'

  return (
    <div style={{height: '100%'}} className={classes.flexContainer}>
      <div className={classes.flexGrow}>
        <div className={showLibrary ? classes.activeView : classes.inactiveView}>
          <LibraryView/>
        </div>
        <div className={showLibrary ? classes.inactiveView : classes.activeView}>
          {props.children}
        </div>
      </div>
    </div>
  )
}

CoreLayout.propTypes = {
  children: React.PropTypes.element,
  routerPath: React.PropTypes.string.isRequired,
}

const mapStateToProps = (state, ownProps) => ({
  routerPath: ownProps.location.pathname
})

export default connect(mapStateToProps)(CoreLayout)
