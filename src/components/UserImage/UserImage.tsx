import React from 'react'
import Icon from 'components/Icon/Icon'
import styles from './UserImage.css'

interface UserImageProps {
  className?: string
  dateUpdated: number
  height?: number
  userId: number
}

class UserImage extends React.Component<UserImageProps> {
  state = {
    isLoading: true,
    isErrored: false,
  }

  render () {
    const { props, state } = this

    return (
      <>
        {(state.isLoading || state.isErrored) && props.height &&
          <Icon icon='ACCOUNT' size={props.height} className={styles.placeholder}/>
        }

        {!state.isErrored &&
          <img src={`${document.baseURI}api/user/${props.userId}/image?v=${props.dateUpdated}`}
            onLoad={this.handleImgLoad}
            onError={this.handleImgError}
            className={`${styles.image} ${props.className}`}
            style={{
              display: state.isLoading ? 'none' : 'initial',
              height: props.height ? props.height : null,
            }}
          />
        }
      </>
    )
  }

  handleImgLoad = () => {
    this.setState({ isLoading: false })
  }

  handleImgError = () => {
    this.setState({ isErrored: true, isLoading: false })
  }
}

export default UserImage
