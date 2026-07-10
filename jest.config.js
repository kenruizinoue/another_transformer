/**
 * Jest configuration for the Expo app.
 * Uses the jest-expo preset so Expo and React Native modules transform and mock
 * correctly. React Native Testing Library (v12+) auto-registers its matchers.
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  // Reset mock call history between tests so shared mocks (expo-audio, slider)
  // stay isolated and CI runs deterministically.
  clearMocks: true,
  moduleNameMapper: {
    // CSS (global.css / NativeWind) has no meaning under the native Jest env.
    // Must come before the @/ alias so @/global.css maps to the stub, not src.
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    // Mirror the tsconfig path aliases. Assets live at the repo root, so the
    // more specific @/assets rule must precede the general @/ -> src rule.
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // whisper.rn 0.6 omits the root "." export, so resolve the bare import here.
    '^whisper\\.rn$': '<rootDir>/node_modules/whisper.rn/lib/commonjs/index.js',
  },
};
