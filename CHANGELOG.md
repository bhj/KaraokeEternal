## TBD (not yet released)

- (server) Fixed an issue where the queue could be incorrect after setting preferred media
- (server) Improved filename parser and renamed config option `separator` to `delimiter`
- (server) Improved logging and default log file level is now `3` (info)
- (player) Web Audio API support is now required (only for browsers running the player)
- (player) Fixed an issue where media might not (pre)load in Firefox
- (player) Removed visualizer sensitivity control (drop a note if you used it)

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
