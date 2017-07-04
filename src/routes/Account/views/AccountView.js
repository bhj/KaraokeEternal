import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Header from 'components/Header'
import Rooms from '../components/Rooms'
import Media from '../components/Media'
import Account from '../components/Account'
import './AccountView.css'

export default class AccountView extends Component {
  static propTypes = {
    isAdmin: PropTypes.bool,
    viewportStyle: PropTypes.object.isRequired,
  }

  render () {
    const { isAdmin, viewportStyle } = this.props

    return (
      <div styleName='container' style={viewportStyle}>
        <Header />

        {isAdmin &&
          <Rooms />
        }

        {isAdmin &&
          <Media />
        }

        <Account />
      </div>
    )
  }
}
