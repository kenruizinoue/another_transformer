// The shared Whisper model instance is replaced with one over in-memory fake
// files so the Settings screen can be driven without a file system. Built
// inside the factory because ES imports hoist above outer consts.
jest.mock('@/lib/transcription/whisper-model-instance', () => {
  const { WhisperModel } = require('@/lib/transcription/whisper-model');
  const state = { present: false };
  const files = {
    modelPath: 'file:///doc/whisper/model.bin',
    exists: jest.fn(async () => state.present),
    download: jest.fn(async () => {
      state.present = true;
      return true;
    }),
    remove: jest.fn(async () => {
      state.present = false;
    }),
  };
  return { whisperModel: new WhisperModel(files), _state: state };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import * as instance from '@/lib/transcription/whisper-model-instance';

import SettingsScreen from '../(tabs)/settings';

const modelState = (instance as unknown as { _state: { present: boolean } })._state;

beforeEach(async () => {
  await AsyncStorage.clear();
  modelState.present = false;
});

describe('SettingsScreen transcription engine', () => {
  it('lists the three engines and defaults to apple', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByTestId('engine-apple')).toBeTruthy();
    expect(screen.getByTestId('engine-whisper')).toBeTruthy();
    expect(screen.getByTestId('engine-openai')).toBeTruthy();

    // A leading check mark marks the selected engine.
    expect(await screen.findByText('✓ On-device (Apple)')).toBeTruthy();
  });

  it('persists the chosen engine', async () => {
    await render(<SettingsScreen />);
    await screen.findByText('✓ On-device (Apple)');

    await fireEvent.press(screen.getByTestId('engine-openai'));

    expect(await screen.findByText('✓ Cloud (OpenAI)')).toBeTruthy();
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('transcribe-engine')).toBe('openai'),
    );
  });
});

describe('SettingsScreen engine hints', () => {
  it('warns on the openai row when the build has no API key', async () => {
    // Jest runs without EXPO_PUBLIC_OPENAI_API_KEY, mirroring a keyless build.
    await render(<SettingsScreen />);

    expect(screen.getByTestId('openai-key-hint')).toBeTruthy();
  });

  it('shows a snackbar when selecting cloud without a baked key, but still selects it', async () => {
    await render(<SettingsScreen />);
    await screen.findByText('✓ On-device (Apple)');

    await fireEvent.press(screen.getByTestId('engine-openai'));

    expect(await screen.findByTestId('snackbar')).toBeTruthy();
    expect(screen.getByText(/No API key was baked into this build/)).toBeTruthy();
    expect(await screen.findByText('✓ Cloud (OpenAI)')).toBeTruthy();
  });

  it('selecting an on-device engine shows no snackbar', async () => {
    await render(<SettingsScreen />);
    await screen.findByText('✓ On-device (Apple)');

    await fireEvent.press(screen.getByTestId('engine-whisper'));

    expect(screen.queryByTestId('snackbar')).toBeNull();
  });
});

describe('SettingsScreen whisper model', () => {
  it('shows the missing model with a download action and a hint on the engine row', async () => {
    await render(<SettingsScreen />);

    expect(await screen.findByTestId('whisper-download')).toBeTruthy();
    expect(screen.getByTestId('whisper-missing-hint')).toBeTruthy();
  });

  it('downloads the model and becomes ready', async () => {
    await render(<SettingsScreen />);
    await screen.findByTestId('whisper-download');

    await fireEvent.press(screen.getByTestId('whisper-download'));

    expect(await screen.findByTestId('whisper-ready')).toBeTruthy();
    expect(screen.queryByTestId('whisper-missing-hint')).toBeNull();
  });

  it('deletes the model and returns to the download state', async () => {
    modelState.present = true;
    await render(<SettingsScreen />);
    await screen.findByTestId('whisper-ready');

    await fireEvent.press(screen.getByTestId('whisper-delete'));

    expect(await screen.findByTestId('whisper-download')).toBeTruthy();
  });
});
