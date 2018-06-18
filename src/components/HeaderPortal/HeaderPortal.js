import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'

class HeaderPortal extends React.Component {
  static propTypes = {
    children: PropTypes.any,
  }

  state = {
    portalNode: null,
  }

  componentDidMount () {
    const portalNode = document.getElementById('custom-header-container')
    this.setState({ portalNode })
  }

  render () {
    return this.state.portalNode ? ReactDOM.createPortal(this.props.children, this.state.portalNode) : null
  }
}

export default HeaderPortal
