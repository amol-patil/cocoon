const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    arch: ["arm64"], // Target only Apple Silicon
    asar: true, // Enable ASAR packaging for production
    icon: "./icons/cocoon.icns", // Correct icon path for macOS
    appBundleId: "com.pixelpieco.cocoon",
    appCategoryType: "public.app-category.productivity",
    appCopyright: "Copyright © 2023 PixelPieCo",
    osxSign: false, // Keep signing disabled for now
    mas: false, // Not for Mac App Store
    env: {
      NODE_ENV: "production",
    },
    // Name that shows in the Dock
    executableName: "Cocoon",
    // Add info.plist settings
    extendInfo: {
      CFBundleDisplayName: "Cocoon",
      CFBundleName: "Cocoon",
      CFBundleIconFile: "cocoon.icns", // Explicitly set the correct icon file
      NSHumanReadableCopyright: "Copyright © 2023 PixelPieCo",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: {
        arch: ["arm64"], // Match packager arch
        name: "Cocoon Installer", // Name of the DMG file
        icon: "./icons/cocoon.icns", // Icon for the DMG itself
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              name: "main_window",
              html: "./public/index.html",
              js: "./src/renderer/index.tsx",
              preload: {
                js: "./src/main/preload.ts",
              },
            },
          ],
        },
      },
    },
    // Minimal Fuses configuration
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
    }),
  ],
};
