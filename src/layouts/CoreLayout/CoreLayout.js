import React from 'react'
import { connect } from 'react-redux'
import Header from 'components/Header/HeaderContainer'
import Navigation from 'components/Navigation'
import LibraryView from '../../routes/Library/containers/LibraryContainer'
import classes from './CoreLayout.css'
import '../../styles/core.scss'
import '../../styles/nomodule/material-ui.scss'

const CoreLayout = (props) => {
  let showLibrary = props.routerPath === '/library'
  let title = props.routerPath

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Header title={title} />

      <div style={{flex: '1', position: 'relative'}}>
        <div className={showLibrary ? classes.active : classes.inactive}>
          <LibraryView/>
        </div>
        <div className={showLibrary ? classes.inactive : classes.active}>
          {props.children}
        </div>
      </div>

      <Navigation/>
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
