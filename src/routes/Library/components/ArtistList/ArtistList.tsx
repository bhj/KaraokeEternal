import React, { useEffect, useRef } from 'react'
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

  return (
    <ArtistItem
      artistSongIds={artist.songIds} // "children"
      isExpanded={expandedArtists.includes(artist.artistId)}
      key={artist.artistId}
      name={artist.name}
      numStars={starredArtistCounts[artist.artistId] || 0}
      onArtistClick={() => dispatch(toggleArtistExpanded(artist.artistId))}
      upcomingSongs={upcoming}
      currentSongId={current}
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
  const scrollOffset = useAppSelector(state => state.library.artistsScrollOffset)
  const alphaPickerMap = useAppSelector(getAlphaPickerMap)
  const artists = useAppSelector(state => state.artists)

  const lastScrollOffsetRef = useRef(scrollOffset)
  const listRef = useRef<ListImperativeAPI | null>(null)

  useEffect(() => {
    return () => {
      dispatch(scrollArtists(lastScrollOffsetRef.current))
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    lastScrollOffsetRef.current = e.currentTarget.scrollTop
  }

  const handleAlphaPick = (char: string) => {
    const row = alphaPickerMap[char]

    if (typeof row !== 'undefined' && listRef.current) {
      // +1 for PaddedList's top spacer row
      listRef.current.scrollToRow({ index: row + 1, align: 'start' })
    }
  }

  const handleRef = (ref: ListImperativeAPI | null) => {
    listRef.current = ref
  }

  if (artists.result.length === 0) return null

  return (
    <div>
      <PaddedList
        rowComponent={RowComponent}
        rowProps={{ dispatch, artists, expandedArtists }}
        rowHeight={rowHeight}
        numRows={artists.result.length}
        defaultScrollOffset={scrollOffset}
        onScroll={handleScroll}
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
