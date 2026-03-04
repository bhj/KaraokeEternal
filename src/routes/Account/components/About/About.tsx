import React, { useState } from 'react'
import clsx from 'clsx'
import Panel from 'components/Panel/Panel'
import Icon from 'components/Icon/Icon'
import Logo from 'components/Logo/Logo'
import Modal from 'components/Modal/Modal'
import Button from 'components/Button/Button'
import { useT } from 'i18n'
// @ts-expect-error: not worth configuring TS for this one weird import
import html from '<PROJECT_ROOT>/CHANGELOG.md'
import styles from './About.css'

const curYear = new Date().getFullYear()

const About = () => {
  const t = useT()
  const [isChangelogOpen, setChangelogOpen] = useState(false)
  const toggleChangelog = () => setChangelogOpen(prevState => !prevState)

  return (
    <Panel title={t('about', 'title')} contentClassName={styles.content}>
      <>
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
          <a className={styles.pseudolink} onClick={toggleChangelog}>{t('about', 'changelogSponsors')}</a>
          {' '}
          |
          {' '}
          <a href='/licenses.txt' target='_blank'>{t('about', 'licenses')}</a>
        </p>

        <div className={styles.ghButtonContainer}>
          <div className={styles.ghButton}>
            {/* @ts-expect-error: global via Webpack */}
            <a href={__KE_URL_REPO__} target='_blank' rel='noreferrer'>
              <Icon icon='GITHUB_REPO' size={16} />
              GitHub
            </a>
          </div>
          <div className={clsx(styles.ghButton, styles.star)}>
            {/* @ts-expect-error: global via Webpack */}
            <a href={__KE_URL_REPO__} target='_blank' rel='noreferrer'>
              <Icon icon='GITHUB_STAR' size={16} />
              Star
            </a>
          </div>

          <div className={clsx(styles.ghButton, styles.sponsor)}>
            {/* @ts-expect-error: global via Webpack */}
            <a href={__KE_URL_SPONSOR__} target='_blank' rel='noreferrer'>
              <Icon icon='GITHUB_SPONSOR' size={16} />
              Sponsor
            </a>
          </div>
        </div>

        {isChangelogOpen && (
          <Modal
            title={t('about', 'changelogSponsors')}
            className={styles.changelog}
            onClose={toggleChangelog}
            scrollable
            buttons={(
              <Button variant='primary' onClick={toggleChangelog}>
                {t('about', 'done')}
              </Button>
            )}
          >
            {/* @todo: without this anchor the changelog gets scrolled to
              the first "real" link, even with focusTrapped=false */}
            <a href='' aria-hidden></a>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Modal>
        )}
      </>
    </Panel>
  )
}

export default About
