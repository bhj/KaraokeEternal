import React, { useState, useCallback } from 'react'
import clsx from 'clsx'
import Icon from 'components/Icon/Icon'
import styles from './UserImage.css'

interface UserImageProps {
  className?: string
  dateUpdated: number
  userId: number
}

const UserImageContent = ({ dateUpdated, userId }: { dateUpdated: number, userId: number }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isErrored, setIsErrored] = useState(false)

  const handleLoaded = useCallback(() => setIsLoading(false), [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setIsErrored(true)
  }, [])

  return (
    <>
      {(isLoading || isErrored) && (
        <Icon icon='ACCOUNT' />
      )}

      {!isErrored && (
        <img
          src={`${document.baseURI}api/user/${userId}/image?v=${dateUpdated}`}
          onLoad={handleLoaded}
          onError={handleError}
          style={{
            display: isLoading ? 'none' : 'initial',
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
