import { describe, it, expect } from 'vitest'
import MetaParser from './MetaParser.js'

describe('MetaParser', () => {
  const parser = MetaParser()

  const testCases = [
    // article normalization
    'The Beatles - A Day In The Life',
    'Beatles, The - Day In The Life, A',
    'ABC12345-01_-_Lion_King,_The_-_Warthog_Rhapsody',
    `ABC-1234-THE LIFE OF RILEY-LIGHTNING SEEDS, THE`,
    'MJM10-01 - Temp - The Beat Goes On [duet]',
    `Tyler, The Creator - See You Again [AZ Karaoke]`,
    // "ft." normalization
    'Calvin Harris ft. Florence Welch - Sweet Nothing [AZ Karaoke]',
    'Britney Spears Ft Will.I.Am - It Should Be Easy [AZ Karaoke]',
    'Lloyd Ft Andre 3000 & Lil Wayne - Dedication To My Ex (Miss That) [Karaoke]',
    'Britney Spears Feat. G-Eazy - Make Me [AZ Karaoke]',
    'Charli Xcx Feat Lil Yachty - After The Afterparty [AZ Karaoke]',
    // artist name normalization
    '01 - Sinatra, Nancy & Frank - Something Stupid',
    'Az123-01 - Knight, Gladys & The Pips - Way We Were, The',
    '01 - Pickett, Bobby Boris & Crypt Kickers - Monster Mash',
    `AZ1234-01 - Van Beethoven, Camper - Take The Skinheads Bowling`,
    `Camper Van Beethoven - Take The Skinheads Bowling [AZ Karaoke]`,
    `AB1234Z-01 - Scott, Linda - I've Told Every Little Star`,
    'The Bird & The Bee - Something & Something (test)',
    // de-"in the style of"
    `(You Drive Me) Crazy in the Style of 'Britney Spears' karaoke video with lyrics (with lead vocal)`,
    `When You Say Nothing At All in the Style of 'Alison Krauss & Union Station' (no lead vocal)`,
    `Ain't Too Proud To Beg in the style of The Rolling Stones - karaoke video with lyrics`,
    // de-karaoke
    `Hello Goodbye - The Beatles _ Karaoke with Lyrics`,
    'Williamsndy - Speak Softly, Love (Godfather Theme) [Karaoke]',
    'Craig McLachlan & Check 1-2 - Mona [ABC Karaoke]',
    'Blue (Eurovision 2011) - I Can [ABC Karaoke]',
    `Len Barry - 1-2-3 [Karaoke]`,
    // track id/number removal
    'AZ1234-01 - 10,000 Maniacs - Trouble Me',
    'ABCD2-1-01 - Vanessa Carlton - A Thousand Miles',
    '1 - Level42 - Something About You',
    'Az 1234-01 - Boney-M - Daddy Cool',
    `UB40 - Homely Girl`,
    `Disney - 101 Dalmations - Cruella De Vil`,
    // ensure unicode is being passed through correctly
    `ちゃんみな - 「ハレンチ」`,
    `ちゃんみな - 花火`,
  ]

  it('should parse all test filenames correctly', () => {
    const results = testCases.map(filename => ({
      input: filename,
      output: parser({ name: filename }),
    }))

    expect(results).toMatchSnapshot()
  })

  // Individual test for debugging purposes
  testCases.forEach((filename) => {
    it(`should parse: ${filename}`, () => {
      const result = parser({ name: filename })
      expect(result).toMatchSnapshot()
    })
  })
})
