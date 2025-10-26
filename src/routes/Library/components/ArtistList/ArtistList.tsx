import React, { useCallback, useEffect, useRef } from 'react'
import { ensureState } from 'redux-optimistic-ui'
import { RootState } from 'store/store'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { scrollArtists, toggleArtistExpanded } from '../../modules/library'
import getAlphaPickerMap from '../../selectors/getAlphaPickerMap'
import getQueuedSongs from '../../selectors/getQueuedSongs'
import PaddedList from 'components/PaddedList/PaddedList'
import AlphaPicker from '../AlphaPicker/AlphaPicker'
import ArtistItem from '../ArtistItem/ArtistItem'
import type { ListImperativeAPI, RowComponentProps } from 'react-window'

const ROW_HEIGHT = 44

interface ArtistListProps {
  ui: RootState['ui']
}

interface CustomRowProps {
  dispatch: ReturnType<typeof useAppDispatch>
  artists: RootState['artists']
  expandedArtists: number[]
}

// this is outside the ArtistList component to keep the reference as stable as possible,
// as react-window will re-render the list (breaking animations) when RowComponent changes
const RowComponent = ({
  index,
  style,
  // below are also used in ArtistList and passed via rowProps to avoid duplicate effort
  dispatch,
  artists,
  expandedArtists,
}: RowComponentProps<CustomRowProps>) => {
  const starredArtistCounts = useAppSelector(state => state.starCounts.artists)
  const { starredSongs } = useAppSelector(state => ensureState(state.userStars))
  const queuedSongs = useAppSelector(getQueuedSongs)

  const artist = artists.entities[artists.result[index]]

  return (
    <ArtistItem
      artistSongIds={artist.songIds} // "children"
      isExpanded={expandedArtists.includes(artist.artistId)}
      key={artist.artistId}
      name={artist.name}
      numStars={starredArtistCounts[artist.artistId] || 0}
      onArtistClick={() => dispatch(toggleArtistExpanded(artist.artistId))}
      queuedSongs={queuedSongs}
      starredSongs={starredSongs}
      style={style}
    />
  )
}

const ArtistList = ({
  ui,
}: ArtistListProps) => {
  const dispatch = useAppDispatch()
  const { expandedArtists } = useAppSelector(state => state.library)
  const scrollRow = useAppSelector(state => state.library.scrollRow)
  const alphaPickerMap = useAppSelector(getAlphaPickerMap)
  const artists = useAppSelector(state => state.artists)

  const lastScrollRow = useRef(scrollRow)
  const list = useRef<ListImperativeAPI | null>(null)

  useEffect(() => {
    return () => {
      dispatch(scrollArtists(lastScrollRow.current))
    }
  }, [dispatch])

  const rowHeight = useCallback((index: number) => {
    const artistId = artists.result[index]
    let rows = 1

    if (expandedArtists.includes(artistId)) {
      rows += artists.entities[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }, [artists, expandedArtists])

  const handleRowsRendered = useCallback(({ startIndex }: { startIndex: number }) => {
    // console.log('rendered rows: ', { startIndex })
    lastScrollRow.current = startIndex
  }, [])

  const handleAlphaPick = useCallback((char: string) => {
    const row = alphaPickerMap[char]

    if (typeof row !== 'undefined' && list.current) {
      list.current.scrollToRow({ index: row > 0 ? row - 1 : row, align: 'start' })
    }
  }, [alphaPickerMap])

  const handleRef = useCallback((ref: ListImperativeAPI | null) => {
    if (ref) {
      list.current = ref

      if (lastScrollRow.current) {
      // console.log(`handleRef: scrolling to ${lastScrollRow.current}`)
        list.current.scrollToRow({ index: lastScrollRow.current, align: 'start', behavior: 'instant' })
      }
    }
  }, [])

  if (artists.result.length === 0) return null

  return (
    <div>
      <PaddedList
        rowComponent={RowComponent}
        rowProps={{ dispatch, artists, expandedArtists }}
        rowHeight={rowHeight}
        numRows={artists.result.length}
        onRowsRendered={handleRowsRendered}
        onRef={handleRef}
        paddingTop={ui.headerHeight}
        paddingRight={30} // width of AlphaPicker
        paddingBottom={ui.footerHeight}
        width={ui.innerWidth}
        height={ui.innerHeight}
      />
      <AlphaPicker
        onPick={handleAlphaPick}
        height={ui.innerHeight - ui.headerHeight - ui.footerHeight}
        top={ui.headerHeight}
      />
    </div>
  )
}

export default ArtistList
