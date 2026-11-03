import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import { useAppSelector } from 'store/hooks'
import { Provider } from 'shared/types'
import styles from './ProviderItem.css'

interface ProviderItemProps {
  index: number
  onInfo: (providerId: number) => void
  provider: Provider
}

const ProviderItem = ({ index, onInfo, provider }: ProviderItemProps) => {
  const status = useAppSelector(state => state.prefs.providerStatus[provider.providerId])
  // checking is transient, and disabled providers aren't checked
  const alert = provider.prefs.enabled && status && status.state !== 'ready' && status.state !== 'checking'
    ? status.message ?? status.state
    : null
  const handleInfo = (e: React.SyntheticEvent<HTMLElement>) => onInfo(parseInt(e.currentTarget.dataset.providerId))

  return (
    <Draggable draggableId={`provider-${provider.providerId}`} index={index}>
      {provided => (
        <div
          className={styles.providerItem}
          key={provider.providerId}
          ref={provided.innerRef}
          style={provided.draggableProps.style}
          {...provided.draggableProps}
        >
          <div {...provided.dragHandleProps} tabIndex={-1}>
            <Icon icon='DRAG_INDICATOR' className={styles.btnDrag} />
          </div>
          <div className={clsx(styles.providerName, !provider.prefs.enabled && styles.disabled)}>
            {provider.name}
          </div>
          <Button
            className={clsx(styles.btnInfo, alert && styles.alert)}
            data-provider-id={provider.providerId}
            icon={alert ? 'ALERT_OUTLINE' : 'INFO_OUTLINE'}
            onClick={handleInfo}
            title={alert ?? undefined}
            aria-label={alert ?? 'Provider Info'}
          />
        </div>
      )}
    </Draggable>
  )
}

export default ProviderItem
