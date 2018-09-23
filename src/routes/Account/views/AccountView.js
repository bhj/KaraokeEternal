import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Header from 'components/Header'
import Rooms from '../components/Rooms'
import Prefs from '../components/Prefs'
import Account from '../components/Account'
import Login from '../components/Login'
import './AccountView.css'

export default class AccountView extends Component {
  static propTypes = {
    isAdmin: PropTypes.bool,
    isLoggedIn: PropTypes.bool,
    ui: PropTypes.object.isRequired,
  }

  render () {
    const { isAdmin, isLoggedIn, ui } = this.props

    return (
      <div styleName='container' style={{
        paddingTop: ui.headerHeight,
        paddingBottom: ui.footerHeight,
        width: ui.browserWidth,
        height: ui.browserHeight,
      }}>
        <Header />

        {isAdmin &&
          <Rooms />
        }

        {isAdmin &&
          <Prefs />
        }

        {isLoggedIn &&
          <Account />
        }

        {!isLoggedIn &&
          <Login />
        }
      </div>
    )
  }
}
