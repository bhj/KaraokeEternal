import PropTypes from 'prop-types'
import React from 'react'
import LocalMedia from './LocalMedia'
import OnlineMedia from './OnlineMedia'
import './Media.css'

export default class Media extends React.Component {
  static propTypes = {
    fetchPaths: PropTypes.func.isRequired,
    fetchPrefs: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchPaths()
    this.props.fetchPrefs()
  }

  render () {
    return (
      <div styleName='container'>
        <h1 styleName='title'>Media</h1>
        <div styleName='content'>
          <LocalMedia />

          <h2 styleName='subheading'>
            <i className='material-icons'>cloud</i>
            &nbsp;Online
          </h2>
          <OnlineMedia />
        </div>
      </div>
    )
  }
}
