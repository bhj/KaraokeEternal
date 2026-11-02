import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import Accordion from 'components/Accordion/Accordion'
import Icon from 'components/Icon/Icon'
import EditProvider from './EditProvider/EditProvider'
import ProviderItem from './ProviderItem/ProviderItem'
import Button from 'components/Button/Button'
import styles from './ProviderPrefs.css'
import { setProviderPriority } from 'store/modules/prefs'
import type { Provider } from 'shared/types'

const ProviderPrefs = () => {
  const providers = useAppSelector(state => state.prefs.providers)
  const [isEditorOpen, setEditorOpen] = useState(false)
  const [editorProvider, setEditorProvider] = useState<Provider | undefined>()
  const [priority, setPriority] = useState(providers.result)
  const [prevProviders, setPrevProviders] = useState(providers)

  if (providers !== prevProviders) {
    setPrevProviders(providers)
    setPriority(providers.result)
  }

  const dispatch = useAppDispatch()

  const handleDragEnd = (dnd: DropResult) => {
    if (!dnd.destination) return

    const res = priority.slice()
    const [removed] = res.splice(dnd.source.index, 1)
    res.splice(dnd.destination.index, 0, removed)

    setPriority(res)
    dispatch(setProviderPriority(res as number[]))
  }

  const handleAdd = () => {
    setEditorProvider(undefined)
    setEditorOpen(true)
  }

  const handleInfo = (providerId: number) => {
    setEditorProvider(providers.entities[providerId])
    setEditorOpen(true)
  }

  const handleClose = () => setEditorOpen(false)

  return (
    <Accordion headingComponent={(
      <div className={styles.heading}>
        <Icon icon='EXPERIMENTAL' />
        <div className={styles.title}>Providers</div>
      </div>
    )}
    >
      <div className={styles.content}>
        {providers.result.length === 0
          && <p style={{ marginTop: 0 }}>Add a provider to extend Karaoke Eternal.</p>}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId='providers-droppable'>
            {provided => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {priority.map((providerId, i) => (
                  <ProviderItem
                    index={i}
                    key={providerId}
                    provider={providers.entities[providerId]}
                    onInfo={handleInfo}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className={styles.btnContainer}>
          <Button onClick={handleAdd} variant='primary'>
            Add Provider
          </Button>
        </div>

        {isEditorOpen && <EditProvider onClose={handleClose} provider={editorProvider} />}
      </div>
    </Accordion>
  )
}

export default ProviderPrefs
