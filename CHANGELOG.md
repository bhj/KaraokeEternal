## 2026.02.02

### Karaoke Hydra

The project has been renamed from Karaoke Eternal to **Karaoke Hydra** to reflect the integration of the Hydra live-coding visual synthesizer.

### Hydra Visualizer & Orchestrator

- Live audio-reactive visuals powered by [Hydra](https://hydra.ojack.xyz/)
- Orchestrator UI with real-time code editor, syntax highlighting, and Aqua theme
- Preset gallery with 58 curated sketches, search, and tag filtering
- Injection strength control (Low/Med/High) to scale audio-reactive intensity
- Auto Audio injection with per-preset profile scaling
- Mobile-optimized tabbed layout (Stage / Code / Presets) with CSS subgrid
- Mobile refPanel overlay with click-to-close backdrop

### Audio Controls Simplified

- Removed redundant Sensitivity slider from Display Controls
- Relabeled "Gain (post-FFT)" to "Audio Sensitivity"
- Hardcoded gain node to 1.0 (existing saved preferences are harmlessly ignored)

---

## v2.0.1 (2026-01-10)

- Obligatory bug fixes and performance improvements

## v2.0.0 (2025-12-26)

**Sponsored by**: [candre23](https://github.com/candre23), [nellisdev](https://github.com/nellisdev), [astrobyte](https://github.com/astrobyte), [jfeldhamer](https://github.com/jfeldhamer), [cubandaddy](https://github.com/cubandaddy), [Backroads4Me](https://github.com/Backroads4Me) and other private sponsors. Thank you! If you have fun with it, please consider [sponsoring](https://www.karaoke-eternal.com/sponsor).

### Guest accounts and QR codes

Joining the party is now faster and easier. The player supports QR codes that link directly to a room, where singers can now (finally!) join as guests. Admins can also choose whether a room allows guests and/or new standard users, or only existing users.

### Videos + visualizer

Visualizations are now supported with video files. By automatically detecting a video's background color and making it transparent, visualizer effects can be displayed behind the lyrics. This works best on videos with solid color backgrounds, and can be enabled by selecting "Allow video background keying" in the media folder's preferences.

### Improved queue management

Enhancements to the queue include:

- The queue can be restarted from any previously played song, or the beginning of the current song
- All upcoming songs for a user can be removed at once by long-pressing the *Remove* or *Skip* buttons
- When a standard user or guest signs out, their upcoming songs are now automatically removed from the queue

### Metadata parser changes

Previously, the metadata parser (which uses filenames or tags to determine artist names and song titles) could be customized via `_kes.v1.js` files which were essentially arbitrary JavaScript. They were run in a sandbox to limit their functionality, but that sandbox was deprecated, and the overall approach was complex.

In v2, the parser instead uses `_kes.v2.json` files. These JSON files allow the same basic configuration, in addition to simple string replacement and "templating" of artist names and song titles. See the docs for more information. As always, the best approach is to properly name/tag media, but customizing the parser can help in specific cases.

### Other features and fixes

- **(Server)** Zipped MP3+G media is now supported
- **(Server)** Media folders can now be watched for changes, as well as manually scanned individually
- **(Server)** Fixed an error when listing drives on Windows due to removal of `wmic` (thanks Microsoft! /s)
- **(Server)** Usernames/emails are no longer case sensitive (thanks **gazugafan**)
- **(Library)** Songs that have already been played in the current session appear greyed
- **(Library)** Tapping a song that is already upcoming no longer queues it again
- **(Player)** Fixed incorrect calculation of ReplayGain values (thanks **laberning**)
- **(General)** Prevent auto-translation of some UI elements (thanks **laberning**)

This release includes contributions from [gazugafan](https://github.com/gazugafan), [gausie](https://github.com/gausie), [EffakT](https://github.com/EffakT) and [laberning](https://github.com/laberning), as well as testing by **mjmeans**. Thanks!

## v1.0.0 (2022-05-17)

Sponsored by: [consolecwby](https://github.com/consolecwby), [vze22jjw](https://github.com/vze22jjw). Thank you! If you have fun with it, please consider [sponsoring](https://www.karaoke-eternal.com/sponsor).

### New

- **Name**: Karaoke Forever is now Karaoke Eternal
- **(app)** User management interface
- **(app)** "Make user's next" button for upcoming songs
- **(app)** "Re-queue" button for played songs
- **(app)** Content-aware CD+Graphics backgrounds
- **(app)** Media folders can be prioritized via drag-and-drop
- **(app)** Added ~370 visualizer presets (now 472 total)
- **(app)** Summary is shown following a media scan
- **(server)** Custom URL path (subfolder) support (see `--urlPath` CLI option)
- **(server)** Custom database file path support (see `--data` CLI option)
- **(server)** Session key can be rotated on startup (see `--rotateKey` CLI option)
- **(server)** All CLI options now have equivalent environment variables

### Changed

- **(app)** Next-up singer's place is now reserved and won't be pre-empted
- **(server)** Uses one less process/helper
- **(server)** Media scanner performance is greatly improved when adding media
- **(server)** Improved client connection speed via library caching
- **(server)** Media scanner process is restricted to read-only database access
- **(server)** Fixed potential error when a non-admin user tries to remove one of their queued songs
- **(server)** Fixed potential SQLITE_BUSY errors while scanning media
- **(server)** Fixed error message when no artist/title delimiter in filename
- **(server)** Idle client socket connections no longer bounce

## v0.8.0 (2020-07-03)

### [Black Lives Matter.](https://blacklivesmatter.com)

### Sponsors

Massive thanks to this release's sponsors: [fulldecent](https://github.com/fulldecent), [vze22jjw](https://github.com/vze22jjw). If you have fun with it, please consider [sponsoring](https://www.karaoke-eternal.com/sponsor).

### New

- **(app)** [ReplayGain support](http://www.karaoke-eternal.com/docs/#preferences-admin-only). No more scrambling for the volume when a new song starts! With properly tagged media, the player can automatically minimize volume differences between songs.
- **(app)** Rooms can now be password-protected
- **(player)** CD+Graphics now have shadows, can be resized, and use less CPU
- **(player)** **(breaking)** Web Audio API support is now required (only for browsers running the player)
- **(server)** **(breaking)** Database will be migrated and no longer compatible with v0.7.x

### Changed

- **(app)** Reduced motion and improved accessibility of modals
- **(app)** Fixed status not respected when creating a new room
- **(player)** Visualizer sensitivity can now be set up to 200%
- **(player)** Fixed media possibly not (pre)loading in Firefox
- **(server)** Added minimum password length requirement (6) and removed limit
- **(server)** Fixed incorrect queue potentially emitted after setting preferred media
- **(server)** Improved filename parser and renamed config option `separator` to `delimiter`
- **(server)** Improved logging and made `3 (info)` the default log file level

## v0.7.4 (2019-12-30)

- Initial release on [npm](https://www.npmjs.com/package/karaoke-eternal)
- **(app)** Improved sign in/first run form
- **(app)** Added About panel with version and licenses
- **(app)** General style improvements
- **(server)** Improved field validation and error messages
- **(server)** Songs/artists without known media are no longer removed automatically after scan
- **(server)** Media in nonexistent paths are now removed after scan
- **(server)** Replace dep `squel` with `sqlate`

## v0.7.3 (2019-09-13)

- Initial public release :-D
