import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import styles from './PathItem.css'

const PathItem = (props) => {
  return (
    <div className={styles.container} onClick={props.onSelect}>
      <div>
        <Icon icon='FOLDER' size={28} className={styles.folder} />
      </div>
      <div className={styles.path}>
        {props.path}
      </div>
    </div>
  )
}

PathItem.propTypes = {
  path: PropTypes.string.isRequired,
  onSelect: PropTypes.func,
}

export default PathItem
