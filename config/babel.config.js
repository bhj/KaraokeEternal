export default {
  targets: 'defaults',
  plugins: [
    [
      'babel-plugin-react-compiler',
      {
        target: '18',
        logger: {
          logEvent(filename, event) {
            if (event.kind === 'CompileSuccess') {
              console.log('Compiled:', filename)
            }
          },
        },
      },
    ],
    '@babel/plugin-transform-runtime',
  ],
  presets: [
    '@babel/preset-typescript',
    '@babel/preset-env',
    '@babel/preset-react',
  ],
}
