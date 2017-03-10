import React, { PropTypes } from 'react'
import { browserHistory } from 'react-router'
import AppLayout from 'layouts/AppLayout'
import Header from 'layouts/Header'
import AccountForm from '../containers/AccountForm'
import Logout from './Logout'
import Providers from 'components/providers'

class AccountView extends React.Component {
  static propTypes = {
    user: PropTypes.object,
    logoutUser: PropTypes.func.isRequired,
  }

  render () {
    const { user, prefs } = this.props
    const header = <Header/>
    let prefComponents = []

    for (let i in Providers) {
      if (typeof Providers[i].prefComponent !== 'undefined') {
        let PrefPane = Providers[i].prefComponent
        prefComponents.push(<PrefPane key={i}/>)
      }
    }

    return (
      <AppLayout header={header}>
        {(style) => (
          <div style={{...style, overflowY: 'scroll'}}>
            <AccountForm/>

            {prefComponents}

            {this.props.user && this.props.user.isAdmin &&
              <button className='button wide blue raised' onClick={() => {browserHistory.push('/player')}}>
                Start Player
              </button>
            }

            {this.props.user &&
              <div>
                <br/>
                <Logout onLogoutClick={this.props.logoutUser} />
              </div>
            }
          </div>
        )}
      </AppLayout>
    )
  }
}

export default AccountView
