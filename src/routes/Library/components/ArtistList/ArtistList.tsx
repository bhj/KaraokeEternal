import React, { CSSProperties, useCallback, useEffect, useRef } from 'react'
import { type ListImperativeAPI } from 'react-window'
import PaddedList from 'components/PaddedList/PaddedList'
import AlphaPicker from '../AlphaPicker/AlphaPicker'
import ArtistItem from '../ArtistItem/ArtistItem'
import { RootState } from 'store/store'
import { Artist, Song } from 'shared/types'

const ROW_HEIGHT = 44

interface ArtistListProps {
  alphaPickerMap: Record<string, number>
  artists: Record<number, Artist>
  artistsResult: number[]
  expandedArtists: number[] // artistIds
  filterKeywords: string[]
  queuedSongs: number[] // songIds
  songs: Record<number, Song>
  starredSongs: number[]
  starredArtistCounts: Record<number, number>
  scrollRow: number
  ui: RootState['ui']
  // actions
  toggleArtistExpanded(artistId: number): void
  scrollArtists(scrollRow: number): void
}

const ArtistList = ({
  alphaPickerMap,
  artists,
  artistsResult,
  expandedArtists,
  filterKeywords,
  queuedSongs,
  scrollArtists,
  scrollRow,
  starredArtistCounts,
  starredSongs,
  toggleArtistExpanded,
  ui,
}: ArtistListProps) => {
  const lastScrollRow = useRef(scrollRow)
  const list = useRef<ListImperativeAPI | null>(null)

  // console.log('ArtistList render; headerHeight=', ui.headerHeight)

  useEffect(() => {
    return () => {
      scrollArtists(lastScrollRow.current)
    }
  }, [scrollArtists])

  const rowRenderer = useCallback(({ index, style }: { index: number, style: CSSProperties }) => {
    const artist = artists[artistsResult[index]]

    return (
      <ArtistItem
        artistId={artist.artistId}
        artistSongIds={artist.songIds} // "children"
        filterKeywords={filterKeywords}
        isExpanded={expandedArtists.includes(artist.artistId)}
        key={artist.artistId}
        name={artist.name}
        numStars={starredArtistCounts[artist.artistId] || 0}
        onArtistClick={toggleArtistExpanded}
        queuedSongs={queuedSongs}
        starredSongs={starredSongs}
        style={style}
      />
    )
  }, [artists, artistsResult, expandedArtists, filterKeywords, queuedSongs, starredArtistCounts, starredSongs, toggleArtistExpanded])

  const rowHeight = useCallback((index: number) => {
    const artistId = artistsResult[index]
    let rows = 1

    if (expandedArtists.includes(artistId)) {
      rows += artists[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }, [artists, artistsResult, expandedArtists])

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

  if (artistsResult.length === 0) return null

  return (
    <div>
      <PaddedList
        numRows={artistsResult.length}
        rowHeight={rowHeight}
        rowRenderer={rowRenderer}
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
