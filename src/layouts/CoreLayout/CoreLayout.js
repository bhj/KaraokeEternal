import React from 'react'
import { connect } from 'react-redux'
import Navigation from '../../components/Navigation'
import LibraryView from '../../routes/Library/containers/LibraryContainer'
import classes from './CoreLayout.css'
import '../../styles/core.scss'
import '../../styles/nomodule/material-ui.scss';

const CoreLayout = (props) => {
  let showLibrary = props.routerPath === '/library'

  return (
    <div style={{height: '100%'}} className={classes.container}>
      <div className={classes.viewContainer}>
        <div style={{display: showLibrary ? 'block' : 'none'}} className={classes.view}>
          <LibraryView/>
        </div>
        <div style={{display: showLibrary ? 'none' : 'block'}} className={classes.view}>
          {props.children}
        </div>
      </div>
      <Navigation />
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
