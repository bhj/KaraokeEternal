import React, { useCallback, useEffect, useRef } from 'react'
import { ensureState } from 'redux-optimistic-ui'
import { RootState } from 'store/store'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { scrollArtists, toggleArtistExpanded } from '../../modules/library'
import getAlphaPickerMap from '../../selectors/getAlphaPickerMap'
import getSongsStatus from '../../selectors/getSongsStatus'
import PaddedList from 'components/PaddedList/PaddedList'
import AlphaPicker from '../AlphaPicker/AlphaPicker'
import ArtistItem from '../ArtistItem/ArtistItem'
import type { ListImperativeAPI, RowComponentProps } from 'react-window'

const ROW_HEIGHT_ARTIST = 48
const ROW_HEIGHT_SONG = 56

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
  const { upcoming, current } = useAppSelector(getSongsStatus)

  const artist = artists.entities[artists.result[index]]
  if (current) upcoming.push(current)

  return (
    <ArtistItem
      artistSongIds={artist.songIds} // "children"
      isExpanded={expandedArtists.includes(artist.artistId)}
      key={artist.artistId}
      name={artist.name}
      numStars={starredArtistCounts[artist.artistId] || 0}
      onArtistClick={() => dispatch(toggleArtistExpanded(artist.artistId))}
      upcomingSongs={upcoming}
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

  const initialScrollRow = useRef(scrollRow) // frozen target for restoration
  const lastScrollRow = useRef(scrollRow) // current visible row
  const list = useRef<ListImperativeAPI | null>(null)
  const hasRestoredScroll = useRef(false)

  useEffect(() => {
    return () => {
      // console.log(`[scroll] UNMOUNT: dispatching scrollArtists(${lastScrollRow.current})`)
      dispatch(scrollArtists(lastScrollRow.current))
    }
  }, [dispatch])

  const rowHeight = (index: number) => {
    const artistId = artists.result[index]
    let height = ROW_HEIGHT_ARTIST

    if (expandedArtists.includes(artistId)) {
      height += artists.entities[artistId].songIds.length * ROW_HEIGHT_SONG
    }

    return height
  }

  const handleRowsRendered = ({ startIndex }: { startIndex: number }) => {
    // before restoration runs, ignore the initial startIndex=0 that fires
    // because the list defaults to scrollTop=0; otherwise it would falsely
    // overwrite our saved row when the user navigates away before scrolling.
    if (!hasRestoredScroll.current && startIndex === 0 && initialScrollRow.current) {
      // console.log(`[scroll] rowsRendered IGNORED (pre-restore zero): startIndex=${startIndex}`)
      return
    }
    // console.log(`[scroll] rowsRendered: startIndex=${startIndex} → lastScrollRow.current=${startIndex} (hasRestored=${hasRestoredScroll.current})`)
    lastScrollRow.current = startIndex
  }

  const handleAlphaPick = (char: string) => {
    const row = alphaPickerMap[char]

    if (typeof row !== 'undefined' && list.current) {
      list.current.scrollToRow({ index: row > 0 ? row - 1 : row, align: 'start' })
    }
  }

  const handleRef = useCallback((ref: ListImperativeAPI | null) => {
    list.current = ref

    if (ref?.element && !hasRestoredScroll.current && initialScrollRow.current) {
      // const el = ref.element
      // console.log(`[scroll] BEFORE: target=${initialScrollRow.current} scrollTop=${el.scrollTop} scrollHeight=${el.scrollHeight} clientHeight=${el.clientHeight}`)
      ref.scrollToRow({ index: initialScrollRow.current, align: 'start', behavior: 'instant' })
      // console.log(`[scroll] AFTER: scrollTop=${el.scrollTop} scrollHeight=${el.scrollHeight}`)
      hasRestoredScroll.current = true
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
