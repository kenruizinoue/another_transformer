// Default Jest mock for expo-speech-recognition so modules importing it run in
// CI without the native runtime. The apple-transcriber test overrides this with
// its own factory to drive recognition events.
const granted = { granted: true, canAskAgain: false, status: 'granted' };

module.exports = {
  __esModule: true,
  ExpoSpeechRecognitionModule: {
    getPermissionsAsync: jest.fn().mockResolvedValue(granted),
    requestPermissionsAsync: jest.fn().mockResolvedValue(granted),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    getStateAsync: jest.fn().mockResolvedValue('inactive'),
  },
};
