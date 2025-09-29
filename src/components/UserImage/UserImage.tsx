import React, { useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import Icon from 'components/Icon/Icon'
import styles from './UserImage.css'

interface UserImageProps {
  className?: string
  dateUpdated: number
  userId: number
}

const UserImage = ({ className, dateUpdated, userId }: UserImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isErrored, setIsErrored] = useState(false)

  const handleLoaded = useCallback(() => setIsLoading(false), [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setIsErrored(true)
  }, [])

  useEffect(() => {
    setIsLoading(true)
    setIsErrored(false)
  }, [userId, dateUpdated])

  return (
    <div className={clsx(styles.container, className)}>
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
    </div>
  )
}

export default UserImage
