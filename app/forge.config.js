const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    arch: ['x64', 'arm64'],
    asar: true, // Bundle app source into an archive
    icon: './icons/cocoon', // Updated to match the actual icon filename
    appBundleId: 'com.pixelpieco.cocoon',
    appCategoryType: 'public.app-category.productivity',
    appCopyright: 'Copyright © 2023 PixelPieCo',
    osxSign: false,  // Disable code signing completely
    mas: false,      // Explicitly set not for Mac App Store
    // Name that shows in the Dock
    executableName: 'Cocoon',
    // Add info.plist settings
    extendInfo: {
      CFBundleDisplayName: 'Cocoon',
      CFBundleName: 'Cocoon',
      NSHumanReadableCopyright: 'Copyright © 2023 PixelPieCo'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        arch: ['x64', 'arm64']
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              name: 'main_window',
              html: './public/index.html',
              js: './src/renderer/index.tsx',
              preload: {
                js: './src/main/preload.ts'
              }
            }
          ]
        }
      }
    },
    // Fuses are used to enable/disable experimental features
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
}; 