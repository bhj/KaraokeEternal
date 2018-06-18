import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Rooms from '../components/Rooms'
import Prefs from '../components/Prefs'
import Account from '../components/Account'
import './AccountView.css'

export default class AccountView extends Component {
  static propTypes = {
    isAdmin: PropTypes.bool,
    ui: PropTypes.object.isRequired,
  }

  render () {
    const { isAdmin, ui } = this.props

    return (
      <div styleName='container' style={{
        paddingTop: ui.headerHeight,
        paddingBottom: ui.footerHeight,
        width: ui.browserWidth,
        height: ui.browserHeight,
      }}>
        {isAdmin &&
          <Rooms />
        }

        {isAdmin &&
          <Prefs />
        }

        <Account />
      </div>
    )
  }
}
