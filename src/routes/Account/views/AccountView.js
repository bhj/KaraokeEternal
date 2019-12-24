import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Header from 'components/Header'
import About from '../components/About'
import Account from '../components/Account'
import Login from '../components/Login'
import Prefs from '../components/Prefs'
import Rooms from '../components/Rooms'
import './AccountView.css'

export default class AccountView extends Component {
  static propTypes = {
    browserHeight: PropTypes.number.isRequired,
    contentWidth: PropTypes.number.isRequired,
    headerHeight: PropTypes.number.isRequired,
    footerHeight: PropTypes.number.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
  }

  render () {
    const { browserHeight, contentWidth, headerHeight, footerHeight, isAdmin, isLoggedIn } = this.props

    return (
      <div styleName='container' style={{
        paddingTop: headerHeight,
        paddingBottom: footerHeight,
        width: contentWidth,
        height: browserHeight,
      }}>
        <Header />

        {isAdmin &&
          <Rooms contentWidth={contentWidth}/>
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

        {isLoggedIn &&
          <About />
        }
      </div>
    )
  }
}
