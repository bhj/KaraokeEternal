import React from 'react'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import ToggleAnimation from 'components/ToggleAnimation/ToggleAnimation'
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
  return (
    <Button
      onClick={onClick}
      className={clsx(styles.container, isStarred && styles.starred, className)}
    >
      <ToggleAnimation toggle={isStarred} className={styles.animateStar}>
        <Icon icon='STAR_FULL' />
      </ToggleAnimation>
      <div className={styles.starCount}>
        {count || ''}
      </div>
    </Button>
  )
}

export default ButtonStar
