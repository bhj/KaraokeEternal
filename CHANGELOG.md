## TBD (not yet released)

### New:

- Added [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain) support. With properly tagged media files, the player can automatically adjust each song's volume for a much smoother experience when songs vary widely in average loudness. *Requires re-scanning media*.
- Added the ability to resize CD+Graphics
- Added Changelog viewer to the About panel

### Changed:

- (app) Fixed status not being respected when creating a new room
- (player) Web Audio API support is now required (only for browsers running the player)
- (player) Fixed media potentially not (pre)loading in Firefox
- (player) Removed visualizer sensitivity control (drop a note if you used it)
- (server) Fixed potentially incorrect queue list being emitted after setting preferred media
- (server) Improved filename parser and renamed config option `separator` to `delimiter`
- (server) Improved logging and made `3 (info)` the default log file level

## v0.7.4 (2019-12-30)

- Initial release on [npm](https://www.npmjs.com/package/karaoke-forever)
- (app) Improved sign in/first run form
- (app) Added About panel with version and licenses
- (app) General style improvements
- (server) Improved field validation and error messages
- (server) Songs/artists without known media are no longer removed automatically after scan
- (server) Media in nonexistent paths are now removed after scan
- (server) Replace dep `squel` with `sqlate`

## v0.7.3 (2019-09-13)

- Initial public release :-D
