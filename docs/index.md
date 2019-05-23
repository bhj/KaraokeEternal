# Karaoke Forever

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's web browser. The web app is locally hosted (see [Karaoke Forever Server](https://www.karaoke-forever.com/docs/#karaoke-forever-server)) with no internet connection required and all data staying on your server/network.

See the [documentation](https://www.karaoke-forever.com/docs) to get started. Packaged downloads are coming soon.

## Features

- Modern browser-based app and player
- [MP3+G](https://en.wikipedia.org/wiki/MP3%2BG) and MP4 video file support
- Milkdrop visualizations via [Butterchurn](https://github.com/jberg/butterchurn) (requires [WebGL 2 support](https://caniuse.com/#feat=webgl2))
- Queue evenly distributes singers based on time since last sang
- Multiple simultaneous rooms/queues/players
- Dark UI designed for "karaoke conditions"

**Note:** Karaoke Forever does not handle audio *input* and assumes the player's output will be mixed with any microphones (either in software or an outboard mixer)

## Documentation

See the [full documentation here](https://www.karaoke-forever.com/docs).

## Discord

Join the [Karaoke Forever Discord Server](https://discord.gg/PgqVtFq) for general support and development chat, or say hi and show off your setup!

## Development

Currently using [Node.js 12](https://nodejs.org/en/).

1. Clone the project
2. `npm install`
3. `npm run dev` and look for "Web server running at" for the **server URL**

## Contributing

Contributions are most welcome!

## License

MIT License

Copyright 2017-2019 RadRoot LLC
