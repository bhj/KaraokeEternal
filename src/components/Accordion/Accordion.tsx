import React, { useId, useState } from 'react'
import clsx from 'clsx'
import Icon from 'components/Icon/Icon'
import styles from './Accordion.module.css'

export type AccordionProps = {
  className?: string
  children: React.ReactNode
  contentClassName?: string
  heading: React.ReactNode
  iconClassName?: string
  initialExpanded?: boolean
  renderHeading?: (button: React.ReactNode) => React.ReactNode
}

const Accordion = ({
  className,
  children,
  contentClassName,
  heading,
  iconClassName,
  initialExpanded = false,
  renderHeading = button => button,
}: AccordionProps) => {
  const [expanded, setExpanded] = useState(initialExpanded)
  const id = useId()

  const handleOnClick = () => {
    setExpanded(!expanded)
  }

  const button = (
    <button
      type='button'
      id={`accordion-header-${id}`}
      aria-controls={`accordion-panel-${id}`}
      aria-expanded={expanded}
    >
      {heading}
    </button>
  )

  return (
    <div className={clsx(styles.container, className)} {...(expanded && { 'data-expanded': '' })}>
      <div className={clsx(styles.headingContainer)} onClick={handleOnClick}>
        {renderHeading(button)}
        <Icon icon='CHEVRON_RIGHT' className={clsx(styles.icon, iconClassName)} />
      </div>
      <section
        id={`accordion-panel-${id}`}
        aria-labelledby={`accordion-header-${id}`}
        className={clsx(contentClassName)}
        hidden={!expanded}
      >
        {children}
      </section>
    </div>
  )
}

export default Accordion
