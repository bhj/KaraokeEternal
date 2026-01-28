import React from 'react'
import clsx from 'clsx'
import styles from './Panel.css'

interface PanelProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  title: string
  titleComponent?: React.ReactElement
}

const Panel = ({ children, className, contentClassName, title, titleComponent }: PanelProps) => (
  <div className={clsx(styles.container, className)}>
    <div className={styles.titleContainer}>
      <h1>{title}</h1>
      {titleComponent}
    </div>
    <div className={clsx(styles.content, contentClassName)}>
      {children}
    </div>
  </div>
)

export default Panel
