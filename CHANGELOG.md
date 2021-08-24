## TBD

### New
- **(app)** User management interface!
- **(app)** CD+Graphics backgrounds are now content-aware for better visuals and readability
- **(app)** Media folders can now be prioritized via drag-and-drop
- **(app)** Summary is now shown following a media scan
- **(app)** Added ~370 visualizer presets (now 472 total)
- **(server)** Support for custom URL base path (see `--urlPath` CLI option)
- **(server)** Reduced load and improved client connection speed via library caching

### Changed

- **(app)** **(breaking)** Browsers without the [ResizeObserver API](https://caniuse.com/#feat=mdn-api_resizeobserver) are no longer supported
- **(server)** Uses one less process/helper
- **(server)** Media scanner performance is greatly improved when adding media
- **(server)** Media scanner process is restricted to read-only database access
- **(server)** Fixed potential error when a non-admin user tries to remove one of their queued songs
- **(server)** Fixed potential SQLITE_BUSY errors while scanning media
- **(server)** Fixed error message when no artist/title delimiter in filename
- **(server)** Idle client socket connections no longer bounce

## v0.8.0 (2020-07-03)

### [Black Lives Matter.](https://blacklivesmatter.com)

### Sponsors

Massive thanks to this release's sponsors: [fulldecent](https://github.com/fulldecent), [vze22jjw](https://github.com/vze22jjw)

If you have fun with it, consider [sponsoring](https://github.com/sponsors/bhj) as we roll down [the road to v1.0](https://github.com/bhj/karaoke-forever/issues/13).

### New

- **(app)** [ReplayGain support](http://www.karaoke-forever.com/docs/#preferences-admin-only). No more scrambling for the volume when a new song starts! With properly tagged media, the player can automatically minimize volume differences between songs.
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

- Initial release on [npm](https://www.npmjs.com/package/karaoke-forever)
- **(app)** Improved sign in/first run form
- **(app)** Added About panel with version and licenses
- **(app)** General style improvements
- **(server)** Improved field validation and error messages
- **(server)** Songs/artists without known media are no longer removed automatically after scan
- **(server)** Media in nonexistent paths are now removed after scan
- **(server)** Replace dep `squel` with `sqlate`

## v0.7.3 (2019-09-13)

- Initial public release :-D
