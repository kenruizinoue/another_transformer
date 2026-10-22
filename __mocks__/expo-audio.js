// Default Jest mock for expo-audio so any module importing it runs in CI without
// the native runtime. Tests that need specific behavior (recorder state,
// permission results) override this with their own jest.mock('expo-audio', ...).
const recorder = {
  prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
  record: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  getStatus: jest.fn(() => ({})),
  uri: 'file:///tmp/recording.wav',
  currentTime: 0,
  isRecording: false,
};

const grantedPermission = { granted: true, canAskAgain: false, status: 'granted' };

const player = {
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn(),
  playing: false,
  currentTime: 0,
  duration: 0,
};

const playerStatus = {
  playing: false,
  currentTime: 0,
  duration: 0,
  didJustFinish: false,
  isBuffering: false,
  isLoaded: true,
};

module.exports = {
  __esModule: true,
  useAudioRecorder: () => recorder,
  useAudioPlayer: () => player,
  useAudioPlayerStatus: () => playerStatus,
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  getRecordingPermissionsAsync: jest.fn().mockResolvedValue(grantedPermission),
  requestRecordingPermissionsAsync: jest.fn().mockResolvedValue(grantedPermission),
  RecordingPresets: {
    HIGH_QUALITY: {
      extension: '.m4a',
      sampleRate: 44_100,
      numberOfChannels: 2,
      bitRate: 128_000,
      ios: {},
      android: {},
      web: {},
    },
  },
  IOSOutputFormat: { LINEARPCM: 'lpcm' },
  AudioQuality: { MIN: 0, LOW: 32, MEDIUM: 64, HIGH: 96, MAX: 127 },
};
