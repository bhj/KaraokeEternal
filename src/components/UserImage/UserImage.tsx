import React, { useState } from 'react'
import clsx from 'clsx'
import Icon from 'components/Icon/Icon'
import styles from './UserImage.css'

interface UserImageProps {
  className?: string
  dateUpdated: number
  userId: number
}

const UserImageContent = ({ dateUpdated, userId }: { dateUpdated: number, userId: number }) => {
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)

  const handleLoaded = () => setLoading(false)

  const handleError = () => {
    setLoading(false)
    setErrored(true)
  }

  return (
    <>
      {(loading || errored) && (
        <Icon icon='ACCOUNT' />
      )}

      {!errored && (
        <img
          src={`${document.baseURI}api/user/${userId}/image?v=${dateUpdated}`}
          onLoad={handleLoaded}
          onError={handleError}
          style={{
            display: loading ? 'none' : 'initial',
          }}
        />
      )}
    </>
  )
}

const UserImage = ({ className, dateUpdated, userId }: UserImageProps) => (
  <div className={clsx(styles.container, className)}>
    <UserImageContent
      key={`${userId}-${dateUpdated}`}
      userId={userId}
      dateUpdated={dateUpdated}
    />
  </div>
)

export default UserImage
