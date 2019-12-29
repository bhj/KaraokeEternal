import React from 'react'
import Logo from 'components/Logo'
import './About.css'

export default class About extends React.Component {
  render () {
    return (
      <div styleName='container'>
        <h1 styleName='title'>About</h1>
        <div styleName='content'>
          <a href={__KF_HOMEPAGE__}> {/* eslint-disable-line no-undef */}
            <Logo styleName='logo'/>
          </a>
          <p styleName='sm'>
            v{__KF_VERSION__}<br/>&copy;{__KF_COPYRIGHT__} {/* eslint-disable-line no-undef */}
          </p>
          <p><a href='/licenses.txt' target='blank'>View Licenses</a></p>
        </div>
      </div>
    )
  }
}
