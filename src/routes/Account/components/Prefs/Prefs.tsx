import React from 'react'
import { useT } from 'i18n'
import Panel from 'components/Panel/Panel'
import PathPrefs from './PathPrefs/PathPrefs'
import PlayerPrefs from './PlayerPrefs/PlayerPrefs'
import styles from './Prefs.css'

const Prefs = () => {
  const t = useT()
  return (
    <Panel title={t('prefs', 'title')} contentClassName={styles.content}>
      <>
        <PathPrefs />
        <PlayerPrefs />
      </>
    </Panel>
  )
}

export default Prefs
