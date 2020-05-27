import React from 'react'
import GitHubButton from 'react-github-btn'
import Logo from 'components/Logo'
import { SkyLightStateless } from 'react-skylight'
import './About.css'
import html from '<PROJECT_ROOT>/CHANGELOG.md'

export default class About extends React.Component {
  state = {
    isChangelogVisible: false,
  }

  toggleChangelog = () => this.setState({ isChangelogVisible: !this.state.isChangelogVisible })

  render () {
    const Changelog = <SkyLightStateless
      isVisible={this.state.isChangelogVisible}
      onCloseClicked={this.toggleChangelog}
      onOverlayClicked={this.toggleChangelog}
      title={'Changelog & Sponsors'}
      dialogStyles={{
        width: '90%',
        height: '90%',
        top: '5%',
        left: '5%',
        margin: 0,
        overflow: 'auto',
        userSelect: 'text'
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: html }}></div>
      <button onClick={this.toggleChangelog}>
        Done
      </button>
    </SkyLightStateless>

    return (
      <div styleName='container'>
        <h1 styleName='title'>About</h1>
        <div styleName='content'>
          <a href={__KF_URL_REPO__} target='blank'> {/* eslint-disable-line no-undef */}
            <Logo styleName='logo'/>
          </a>
          <p styleName='sm'>
            v{__KF_VERSION__} &nbsp;&nbsp;&copy;{__KF_COPYRIGHT__} {/* eslint-disable-line no-undef */}
          </p>
          <p><a styleName='pseudolink' onClick={this.toggleChangelog}>Changelog &amp; Sponsors</a> | <a href='/licenses.txt' target='blank'>Licenses</a></p>
          <GitHubButton href={__KF_URL_REPO__} data-size="large" data-color-scheme="no-preference: dark; light: dark;">GitHub</GitHubButton>&nbsp;
          <GitHubButton data-icon="octicon-star" href={__KF_URL_REPO__} data-size="large" data-color-scheme="no-preference: dark; light: dark;">Star</GitHubButton>&nbsp;
          <GitHubButton data-icon="octicon-heart" href={__KF_URL_SPONSOR__} data-size="large" data-color-scheme="no-preference: dark; light: dark;">Sponsor</GitHubButton>&nbsp;
          <GitHubButton data-icon="octicon-issue-opened" href={__KF_URL_REPO__ + 'issues'} data-size="large" data-color-scheme="no-preference: dark; light: dark;">Issue</GitHubButton>
        </div>
        {Changelog}
      </div>
    )
  }
}
