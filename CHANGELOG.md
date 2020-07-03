## v0.8.0 (not yet released)

### New:

- (app) [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain) support. No more scrambling for the volume when a new song starts! With properly tagged media, each song's loudness can be normalized automatically.
- (app) Support for password-protected rooms
- (app) Added Changelog/Sponsor viewer and GitHub links to the About panel
- (player) Web Audio API support is now required (only for browsers running the player)
- (player) CD+Graphics now have shadows, can be resized, and use less CPU

### Changed:

- (app) Reduced motion and improved accessibility of modals
- (app) Fixed status not respected when creating a new room
- (player) Visualizer sensitivity can now be set up to 200%
- (player) Fixed media possibly not (pre)loading in Firefox
- (server) Added minimum password length requirement (6) and removed limit
- (server) Fixed incorrect queue potentially emitted after setting preferred media
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
