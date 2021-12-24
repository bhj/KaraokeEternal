import React, { useCallback, useState } from 'react'
import GitHubButton from 'react-github-btn'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import html from '<PROJECT_ROOT>/CHANGELOG.md'
import styles from './About.css'

const About = props => {
  const [isChangelogVisible, setChangelogVisible] = useState(false)
  const toggleChangelog = useCallback(() => setChangelogVisible(prevState => !prevState), [])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>About</h1>
      <div className={styles.content}>
        <a href={__KF_URL_HOME__} target='blank'> {/* eslint-disable-line no-undef */}
          <Logo className={styles.logo}/>
        </a>
        <p className={styles.sm}>
          v{__KF_VERSION__} &nbsp;&nbsp;&copy;{__KF_COPYRIGHT__} {/* eslint-disable-line no-undef */}
        </p>
        <p><a className={styles.pseudolink} onClick={toggleChangelog}>Changelog &amp; Sponsors</a> | <a href='/licenses.txt' target='blank'>Licenses</a></p> {/* eslint-disable-line no-undef, max-len */}
        <GitHubButton href={__KF_URL_REPO__} data-size='large' data-color-scheme='no-preference: dark; light: dark;'>GitHub</GitHubButton>&nbsp; {/* eslint-disable-line no-undef, max-len */}
        <GitHubButton data-icon='octicon-heart' href={__KF_URL_SPONSOR__} data-size='large' data-color-scheme='no-preference: dark; light: dark;'>Sponsor</GitHubButton>&nbsp; {/* eslint-disable-line no-undef, max-len */}
        <GitHubButton data-icon='octicon-issue-opened' href={__KF_URL_REPO__ + 'issues'} data-size='large' data-color-scheme='no-preference: dark; light: dark;'>Issue</GitHubButton> {/* eslint-disable-line no-undef, max-len */}
      </div>

      <Modal
        title={'Changelog & Sponsors'}
        isVisible={isChangelogVisible}
        onClose={toggleChangelog}
        focusTrapped={false}
        style={{
          width: '90%',
          height: '90%',
        }}
      >
        <div className={styles.changelogContainer}>
          <div className={styles.changelogContent}>
            {/* @todo: without this anchor the changelog gets scrolled to
                the first "real" link, even with focusTrapped=false */}
            <a href=""></a>
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
