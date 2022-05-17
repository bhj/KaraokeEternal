const fs = require('fs')
const { LicenseWebpackPlugin } = require('license-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const applyLicenseConfig = config => {
  config.plugins.push(new LicenseWebpackPlugin({
    addBanner: true,
    renderBanner: (filename, modules) => '/*! See licenses in ' + filename + ' */',
    outputFilename: 'licenses.txt',
    perChunkOutput: false,
    renderLicenses: (modules) => {
      modules.unshift(karaokeEternal)
      modules.push(materialDesignIcons)

      return modules.reduce((txt, m, i) => {
        if (m.licenseText) {
          txt += m.packageJson.name + '\n'
          txt += m.licenseText.replace(/(?![^\n]{1,80}$)([^\n]{1,80})\s/g, '$1\n') // 80 char limit
          if (i < modules.length - 1) txt += '\n' + '*'.repeat(79) + '\n\n'
        }

        return txt
      }, '')
    },
  }))

  config.optimization.minimize = true
  config.optimization.minimizer = [
    new TerserPlugin({
      extractComments: false, // prevents TerserPlugin from extracting a [chunkName].js.LICENSE.txt file
      terserOptions: {
        format: {
          // Tell terser to remove all comments except for the banner added via LicenseWebpackPlugin.
          // This can be customized further to allow other types of comments to show up in the final js file as well.
          // See the terser documentation for format.comments options for more details.
          comments: (astNode, comment) => (comment.value.startsWith('! See licenses in '))
        }
      }
    })
  ]

  return config
}

const karaokeEternal = {
  packageJson: {
    name: 'Karaoke Eternal',
  },
  licenseText: fs.readFileSync('./LICENSE', 'utf8'),
}

const materialDesignIcons = {
  // https://github.com/google/material-design-icons
  packageJson: {
    name: 'material-design-icons',
  },
  licenseText:
`Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
`
}

module.exports = applyLicenseConfig
