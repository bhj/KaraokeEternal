import React, { PropTypes } from 'react'
import { browserHistory } from 'react-router'
import AppLayout from 'layouts/AppLayout'
import AccountForm from '../containers/AccountForm'
import Logout from './Logout'
import Providers from 'components/providers'

class AccountView extends React.Component {
  static propTypes = {
    user: PropTypes.object,
    viewMode: PropTypes.string.isRequired,
    logoutUser: PropTypes.func.isRequired,
    errorMessage: PropTypes.string
  }

  render () {
    const { user, prefs } = this.props
    const headerTitle = user ? user.name : (this.props.viewMode === 'login') ? 'Sign In' : 'Create Account'
    let prefComponents = []

    for (let i in Providers) {
      if (typeof Providers[i].prefComponent !== 'undefined') {
        let PrefPane = Providers[i].prefComponent
        prefComponents.push(<PrefPane key={i}/>)
      }
    }

    return (
      <AppLayout title={headerTitle}>
        {(ui) => (
          <div style={{paddingTop: ui.headerHeight, paddingBottom: ui.footerHeight}}>
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
