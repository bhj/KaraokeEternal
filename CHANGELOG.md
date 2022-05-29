## TBD

### Changed

- **(server)**: Usernames are no longer case sensitive (thanks **gazugafan**)

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
