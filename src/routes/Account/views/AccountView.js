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
    isAdmin: PropTypes.bool.isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
    ui: PropTypes.object.isRequired,
  }

  render () {
    const { isAdmin, isLoggedIn } = this.props

    return (
      <div styleName='container' style={{
        paddingTop: this.props.ui.headerHeight,
        paddingBottom: this.props.ui.footerHeight,
        width: this.props.ui.contentWidth,
        height: this.props.ui.innerHeight,
      }}>
        <Header />

        {isAdmin &&
          <Rooms contentWidth={this.props.ui.contentWidth}/>
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
