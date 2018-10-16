import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './QueueItemImage.css'

class QueueItemImage extends React.Component {
  static propTypes = {
    userId: PropTypes.number.isRequired,
    dateUpdated: PropTypes.number.isRequired,
    className: PropTypes.string,
  }

  state = {
    isLoading: true,
    isErrored: false,
  }

  render () {
    return (
      <>
        {(this.state.isLoading || this.state.isErrored) &&
          <Icon icon='ACCOUNT' size={60} styleName='placeholder'/>
        }

        {!this.state.isErrored &&
          <img src={`/api/user/image/${this.props.userId}?v=${this.props.dateUpdated}`}
            onLoad={this.handleImgLoad}
            onError={this.handleImgError}
            className={this.props.className}
            style={{ display: this.state.isLoading ? 'none' : 'initial' }}
          />
        }
      </>
    )
  }

  handleImgLoad= e => {
    this.setState({ isLoading: false })
  }

  handleImgError = e => {
    this.setState({ isErrored: true, isLoading: false })
  }
}

export default QueueItemImage
