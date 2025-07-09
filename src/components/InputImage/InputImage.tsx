import React, { useState, useEffect } from 'react'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import loadImage from 'blueimp-load-image'
import { User } from 'shared/types'
import styles from './InputImage.css'

interface UserImageProps {
  user?: User
  onSelect: (blob: Blob) => void
}

const InputImage = ({ user, onSelect }: UserImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [imageURL, setImageURL] = useState<string | null>(
    user && user.userId !== null
      ? `${document.baseURI}api/user/${user.userId}/image?v=${user.dateUpdated}`
      : null,
  )

  useEffect(() => {
    return () => {
      if (imageURL) {
        URL.revokeObjectURL(imageURL)
      }
    }
  }, [imageURL])

  const handleImgLoad = () => {
    setIsLoading(false)
  }

  const handleImgError = () => {
    setImageURL(null)
    setIsLoading(false)
  }

  const handleImgClear = () => {
    setImageURL(null)
    onSelect(null)
  }

  const handleChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    loadImage(
      file,
      (canvas: HTMLCanvasElement | Event) => {
        if (canvas instanceof Event && canvas.type === 'error') {
          alert('The image could not be loaded.')
          return
        }

        const scaled = loadImage.scale(canvas, {
          maxWidth: 400,
          maxHeight: 300,
          crop: true,
          downsamplingRatio: 0.5,
        })

        scaled.toBlob((blob: Blob) => {
          if (blob) {
            setImageURL(URL.createObjectURL(blob))
            onSelect(blob)
          }
        }, 'image/jpeg')
      },
      {
        canvas: true,
        aspectRatio: 4 / 3,
        orientation: true,
      },
    )
  }

  return (
    <div className={styles.container}>
      {!imageURL && (
        <Icon icon='PERSON_ADD' size={72} className={styles.placeholder} />
      )}

      {imageURL && (
        <img
          src={imageURL}
          width={96}
          height={72}
          onLoad={handleImgLoad}
          onError={handleImgError}
          alt='User Profile'
        />
      )}

      {imageURL && !isLoading && (
        <Button
          className={styles.btnClear}
          icon='CLEAR'
          onClick={handleImgClear}
          size={32}
        />
      )}

      <input
        type='file'
        accept='image/*'
        onChange={handleChoose}
        className={styles.fileInput}
        ref={(node) => {
          if (!node) return

          // prevents cancel event from bubbling up and dismissing a <dialog>
          node.addEventListener('cancel', (e) => {
            e.stopPropagation()
          })
        }}
      />
    </div>
  )
}

export default InputImage
