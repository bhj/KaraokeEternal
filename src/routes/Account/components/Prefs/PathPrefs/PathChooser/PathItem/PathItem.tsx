import React from 'react'
import Icon from 'components/Icon/Icon'
import styles from './PathItem.css'

interface PathItemProps {
  path: string
  onSelect?(event: React.MouseEvent<HTMLDivElement>): void
}

const PathItem = (props: PathItemProps) => {
  return (
    <div className={styles.container} onClick={props.onSelect}>
      <div>
        <Icon icon='FOLDER' size={28} />
      </div>
      <div className={styles.path}>
        {props.path}
      </div>
    </div>
  )
}

export default PathItem
