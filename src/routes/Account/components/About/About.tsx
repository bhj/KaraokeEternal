import React, { useCallback, useState } from 'react'
import Icon from 'components/Icon/Icon'
import Logo from 'components/Logo/Logo'
import Modal from 'components/Modal/Modal'
// @ts-expect-error: not worth configuring TS for this one weird import
import html from '<PROJECT_ROOT>/CHANGELOG.md'
import styles from './About.css'

const curYear = new Date().getFullYear()

const About = () => {
  const [isChangelogVisible, setChangelogVisible] = useState(false)
  const toggleChangelog = useCallback(() => setChangelogVisible(prevState => !prevState), [])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>About</h1>
      <div className={styles.content}>
        {/* @ts-expect-error: global via Webpack */}
        <a href={__KE_URL_HOME__} target='_blank' rel='noreferrer'>
          <Logo className={styles.logo} />
        </a>
        <p className={styles.sm}>
          &copy;
          {`2019-${curYear}`}
          {' '}
          <a href='https://www.radroot.com' target='_blank' rel='noreferrer'>RadRoot LLC</a>
          <br />
          v
          {/* @ts-expect-error: global via Webpack */}
          {__KE_VERSION__}
        </p>
        <p>
          <a className={styles.pseudolink} onClick={toggleChangelog}>Changelog &amp; Sponsors</a>
          {' '}
          |
          {' '}
          <a href='/licenses.txt' target='_blank'>Licenses</a>
        </p>

        <div className={styles.ghButtonContainer}>
          <div className={styles.ghButton}>
            {/* @ts-expect-error: global via Webpack */}
            <a href={__KE_URL_REPO__} target='_blank' rel='noreferrer'>
              <Icon icon='GITHUB_REPO' size={16} />
              GitHub
            </a>
          </div>
          <div className={styles.ghButton}>
            {/* @ts-expect-error: global via Webpack */}
            <a href={__KE_URL_REPO__} target='_blank' rel='noreferrer'>
              <Icon icon='GITHUB_STAR' size={16} />
              Star
            </a>
          </div>

          <div className={`${styles.ghButton} ${styles.sponsor}`}>
            {/* @ts-expect-error: global via Webpack */}
            <a href={__KE_URL_SPONSOR__} target='_blank' rel='noreferrer'>
              <Icon icon='GITHUB_SPONSOR' size={16} />
              Sponsor
            </a>
          </div>
        </div>
      </div>

      <Modal
        title='Changelog & Sponsors'
        visible={isChangelogVisible}
        onClose={toggleChangelog}
        // focusTrapped={false}
        // style={{
        //   width: '90%',
        //   height: '90%',
        // }}
      >
        <div className={styles.changelogContainer}>
          <div className={styles.changelogContent}>
            {/* @todo: without this anchor the changelog gets scrolled to
                the first "real" link, even with focusTrapped=false */}
            <a href=''></a>
            <div dangerouslySetInnerHTML={{ __html: html }}>
            </div>
          </div>
          <div>
            <button className='primary' onClick={toggleChangelog}>
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default About
