import React from 'react'
import Header from 'components/Header'
import Navigation from 'components/Navigation'
import { SkyLightStateless } from 'react-skylight'
import classes from './AppLayout.css'

class AppLayout extends React.Component {
  state = {
    paddingTop: 0,
    paddingBottom: 0,
  }

  handleHeight(type, { height }) {
    this.setState({[type]: height})
  }

  render() {
    return (
      <div>
        <div className={classes.header}>
          <Header
            title={this.props.title}
            isAdmin={this.props.isAdmin}
            onHeight={this.handleHeight.bind(this, 'paddingTop')}
          />
        </div>

        <div className={classes.viewport} style={{width: this.props.browserWidth, height: this.props.browserHeight}}>
          {this.props.children(this.state)}
        </div>

        <div className={classes.nav}>
          <Navigation onHeight={this.handleHeight.bind(this, 'paddingBottom')}/>
        </div>

        <SkyLightStateless
          isVisible={this.props.errorMessage !== null}
          onCloseClicked={this.props.clearErrorMessage}
          onOverlayClicked={this.props.clearErrorMessage}
          title="Oops"
          dialogStyles={{
            width: '80%',
            height: 'auto',
            left: '10%',
            marginLeft: '0'}}
        >
          {this.props.errorMessage}
          <br/><br/><br/>
          <button className="button wide raised" onClick={this.props.clearErrorMessage}>Dismiss</button>
        </SkyLightStateless>
      </div>
    )
  }
}

export default AppLayout
