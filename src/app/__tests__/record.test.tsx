/* eslint-disable import/first -- jest.mock and its mock state must precede imports */
let mockGranted = true;
let mockCanAskAgain = false;

jest.mock('expo-audio', () => ({
  useAudioRecorder: () => ({
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    uri: null,
    currentTime: 0,
    isRecording: false,
  }),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  getRecordingPermissionsAsync: jest.fn(async () => ({
    granted: mockGranted,
    canAskAgain: mockCanAskAgain,
    status: mockGranted ? 'granted' : 'denied',
  })),
  requestRecordingPermissionsAsync: jest.fn(async () => ({
    granted: mockGranted,
    canAskAgain: mockCanAskAgain,
    status: mockGranted ? 'granted' : 'denied',
  })),
  RecordingPresets: { HIGH_QUALITY: { ios: {} } },
  IOSOutputFormat: { LINEARPCM: 'lpcm' },
  AudioQuality: { HIGH: 96 },
}));

import { render, screen } from '@testing-library/react-native';

import type { RecordingStore } from '@/lib/domain';
import { RecordingStoreProvider } from '@/lib/store-context';

import RecordScreen from '../record';

const store = { save: jest.fn() } as unknown as RecordingStore;

function renderScreen() {
  return render(
    <RecordingStoreProvider store={store}>
      <RecordScreen />
    </RecordingStoreProvider>,
  );
}

describe('RecordScreen', () => {
  it('shows the recorder when permission is granted', async () => {
    mockGranted = true;
    mockCanAskAgain = false;
    await renderScreen();

    expect(await screen.findByTestId('record-ready')).toBeTruthy();
    expect(screen.getByTestId('record-toggle')).toBeTruthy();
    expect(screen.getByTestId('record-elapsed')).toHaveTextContent('0:00');
  });

  it('shows a denied state with a path to Settings when permission is denied', async () => {
    mockGranted = false;
    mockCanAskAgain = false;
    await renderScreen();

    expect(await screen.findByTestId('record-denied')).toBeTruthy();
    expect(screen.getByTestId('open-settings')).toBeTruthy();
  });

  it('asks for permission when it is undetermined', async () => {
    mockGranted = false;
    mockCanAskAgain = true;
    await renderScreen();

    expect(await screen.findByTestId('record-request')).toBeTruthy();
    expect(screen.getByTestId('allow-microphone')).toBeTruthy();
  });
});
