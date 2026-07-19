/* eslint-disable */
// Detox configuration. E2E runs locally only (never in CI) and requires a native
// dev build. After `npx expo prebuild -p ios`, confirm the scheme and binaryPath
// below match the generated ios/ project name, then `npm run e2e:build`.
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/anothertransformer.app',
      build:
        'xcodebuild -workspace ios/anothertransformer.xcworkspace -scheme anothertransformer -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 17 Pro',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
  },
};
