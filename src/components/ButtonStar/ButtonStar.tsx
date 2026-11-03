import React from 'react'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import useToggleAnimation from 'lib/useToggleAnimation'
import styles from './ButtonStar.css'

interface ButtonStarProps {
  className?: string
  onClick: (e: React.MouseEvent) => void
  count: number
  isStarred: boolean
}

const ButtonStar = ({
  className,
  onClick,
  count,
  isStarred,
}: ButtonStarProps) => {
  const starAnimation = useToggleAnimation(isStarred, styles.animateStar)

  return (
    <Button
      onClick={onClick}
      className={clsx(styles.container, isStarred && styles.starred, className)}
      aria-label='Star'
      aria-pressed={isStarred}
    >
      <Icon icon='STAR_FULL' className={starAnimation.className} onAnimationEnd={starAnimation.onAnimationEnd} />
      <div className={styles.starCount}>
        {count || ''}
      </div>
    </Button>
  )
}

export default ButtonStar
