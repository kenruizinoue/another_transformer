// The shared Whisper model instance is replaced with one over in-memory fake
// files so the Settings screen can be driven without a file system. Built
// inside the factory because ES imports hoist above outer consts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import * as instance from '@/lib/transcription/whisper-model-instance';

import SettingsScreen from '../(tabs)/settings';

jest.mock('@/lib/transcription/whisper-model-instance', () => {
  const { WhisperModel } = jest.requireActual('@/lib/transcription/whisper-model');
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

const modelState = (instance as unknown as { _state: { present: boolean } })._state;

beforeEach(async () => {
  await AsyncStorage.clear();
  // Reset both the fake files AND the state machine: WhisperModel caches
  // 'ready' and would leak it across tests otherwise.
  await instance.whisperModel.remove();
  modelState.present = false;
});

describe('SettingsScreen transcription engine', () => {
  it('lists the three engines and defaults to apple', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByTestId('engine-apple')).toBeTruthy();
    expect(screen.getByTestId('engine-whisper')).toBeTruthy();
    expect(screen.getByTestId('engine-openai')).toBeTruthy();

    // The selected engine is the checked radio row.
    await waitFor(() => expect(screen.getByTestId('engine-apple')).toBeChecked());
  });

  it('persists the chosen engine', async () => {
    await render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByTestId('engine-apple')).toBeChecked());

    await fireEvent.press(screen.getByTestId('engine-openai'));

    await waitFor(() => expect(screen.getByTestId('engine-openai')).toBeChecked());
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('transcribe-engine')).toBe('openai'),
    );
  });
});

describe('SettingsScreen language', () => {
  it('lists the three languages and defaults to English', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByTestId('language-en-US')).toBeTruthy();
    expect(screen.getByTestId('language-es-MX')).toBeTruthy();
    expect(screen.getByTestId('language-ja-JP')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('language-en-US')).toBeChecked());
  });

  it('persists the chosen language', async () => {
    await render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByTestId('language-en-US')).toBeChecked());

    await fireEvent.press(screen.getByTestId('language-ja-JP'));

    await waitFor(() => expect(screen.getByTestId('language-ja-JP')).toBeChecked());
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('transcribe-language')).toBe('ja-JP'),
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
    await waitFor(() => expect(screen.getByTestId('engine-apple')).toBeChecked());

    await fireEvent.press(screen.getByTestId('engine-openai'));

    expect(await screen.findByTestId('snackbar')).toBeTruthy();
    expect(screen.getByText(/No API key was baked into this build/)).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('engine-openai')).toBeChecked());
  });

  it('selecting apple shows no snackbar', async () => {
    await render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByTestId('engine-apple')).toBeChecked());

    await fireEvent.press(screen.getByTestId('engine-apple'));

    expect(screen.queryByTestId('snackbar')).toBeNull();
  });

  it('blocks selecting whisper while the model is missing and explains why', async () => {
    await render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByTestId('engine-apple')).toBeChecked());

    await fireEvent.press(screen.getByTestId('engine-whisper'));

    expect(await screen.findByTestId('snackbar')).toBeTruthy();
    expect(screen.getByText(/Download the Whisper model below first/)).toBeTruthy();
    // Selection did not change.
    expect(screen.getByTestId('engine-apple')).toBeChecked();
    expect(await AsyncStorage.getItem('transcribe-engine')).toBeNull();
  });

  it('allows selecting whisper once the model is ready', async () => {
    modelState.present = true;
    await render(<SettingsScreen />);
    await screen.findByTestId('whisper-ready');

    await fireEvent.press(screen.getByTestId('engine-whisper'));

    await waitFor(() => expect(screen.getByTestId('engine-whisper')).toBeChecked());
    expect(await AsyncStorage.getItem('transcribe-engine')).toBe('whisper');
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

    const alert = jest.spyOn(Alert, 'alert');
    await fireEvent.press(screen.getByTestId('whisper-delete'));

    // Deleting asks first; nothing is removed until the destructive choice.
    expect(screen.getByTestId('whisper-ready')).toBeTruthy();
    const buttons = alert.mock.calls[0][2] as AlertButton[];
    await act(async () => buttons.find((b) => b.style === 'destructive')?.onPress?.());

    expect(await screen.findByTestId('whisper-download')).toBeTruthy();
  });

  it('shows download progress as a bar', async () => {
    await render(<SettingsScreen />);
    await screen.findByTestId('whisper-download');
    // The fake download never resolves, so the screen stays mid download.
    const download = jest
      .spyOn(instance.whisperModel, 'ensureReady')
      .mockImplementation(async (onProgress) => {
        onProgress?.(0.4);
        return new Promise<boolean>(() => {});
      });

    // Not awaited: the press handler waits on the download, which never ends.
    void fireEvent.press(screen.getByTestId('whisper-download'));

    expect(await screen.findByTestId('whisper-progress')).toHaveTextContent('Downloading 40%');
    expect(screen.getByTestId('whisper-progress-bar')).toHaveStyle({ width: '40%' });
    download.mockRestore();
  });
});

describe('SettingsScreen layout', () => {
  it('puts every section in one scroll view so it never clips as it grows', async () => {
    await render(<SettingsScreen />);

    const scroll = screen.getByTestId('settings-scroll');
    expect(within(scroll).getByTestId('engine-apple')).toBeTruthy();
    expect(within(scroll).getByTestId('whisper-model-section')).toBeTruthy();
    expect(within(scroll).getByText('Another Transformer')).toBeTruthy();
  });
});
