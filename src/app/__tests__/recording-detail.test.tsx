/* eslint-disable import/first -- jest.mock and its mock state must precede imports */
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'r1' }),
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, type AlertButton } from 'react-native';

import {
  makeFakeRouter,
  makeFakeStore,
  makeRecording,
  renderWithProviders,
} from '@/test-utils/store';

import RecordingDetailScreen from '../recording/[id]';

// Stateful fake: get() reflects rename/setTranscript, mirroring the real store
// so the reload-after-transcribe flow shows the saved value.
function storeWithRecording(overrides = {}) {
  let recording = makeRecording({ id: 'r1', title: 'Old title' });
  return makeFakeStore({
    get: jest.fn(async () => recording),
    rename: jest.fn(async (_id, title) => {
      recording = { ...recording, title };
      return recording;
    }),
    remove: jest.fn().mockResolvedValue(undefined),
    setTranscript: jest.fn(async (_id, transcript, engine) => {
      recording = { ...recording, transcript, transcriptEngine: engine };
      return recording;
    }),
    ...overrides,
  });
}

beforeEach(() => mockBack.mockClear());

describe('RecordingDetailScreen', () => {
  it('renames the recording', async () => {
    const store = storeWithRecording();
    await renderWithProviders(<RecordingDetailScreen />, { store });

    await screen.findByTestId('detail-loaded');
    await fireEvent.changeText(screen.getByTestId('rename-input'), 'Team sync');
    // The title saves when editing ends, like Notes; no separate save button.
    await fireEvent(screen.getByTestId('rename-input'), 'endEditing');

    await waitFor(() => expect(store.rename).toHaveBeenCalledWith('r1', 'Team sync'));
  });

  it('rejects an empty title without calling the store', async () => {
    const store = storeWithRecording();
    await renderWithProviders(<RecordingDetailScreen />, { store });

    await screen.findByTestId('detail-loaded');
    await fireEvent.changeText(screen.getByTestId('rename-input'), '   ');
    await fireEvent(screen.getByTestId('rename-input'), 'endEditing');

    expect(store.rename).not.toHaveBeenCalled();
    // The field puts the old title back instead of staying blank.
    expect(screen.getByTestId('rename-input')).toHaveDisplayValue('Old title');
  });

  it('deletes the recording after confirming, then navigates back', async () => {
    const store = storeWithRecording();
    const alert = jest.spyOn(Alert, 'alert');
    await renderWithProviders(<RecordingDetailScreen />, { store });

    await screen.findByTestId('detail-loaded');
    await fireEvent.press(screen.getByTestId('delete'));
    expect(store.remove).not.toHaveBeenCalled();

    const buttons = alert.mock.calls[0][2] as AlertButton[];
    await act(async () => buttons.find((b) => b.style === 'destructive')?.onPress?.());

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(store.remove).toHaveBeenCalledWith('r1');
  });

  it('says which engine and language a transcription will use', async () => {
    await renderWithProviders(<RecordingDetailScreen />, { store: storeWithRecording() });

    expect(await screen.findByTestId('transcribe-hint')).toHaveTextContent(
      'Apple Speech, English. Change in Settings.',
    );
  });

  it('transcribes and shows the transcript, saving it to the store', async () => {
    const store = storeWithRecording();
    const router = makeFakeRouter({ text: 'hello from the meeting', engine: 'apple' });
    await renderWithProviders(<RecordingDetailScreen />, { store, router });

    await screen.findByTestId('detail-loaded');
    await fireEvent.press(screen.getByTestId('transcribe'));

    expect(await screen.findByTestId('transcript')).toHaveTextContent('hello from the meeting');
    await waitFor(() =>
      expect(store.setTranscript).toHaveBeenCalledWith('r1', 'hello from the meeting', 'apple'),
    );
    // Engines scale their timeouts from the audio length.
    expect(router.transcribe).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ durationMsHint: 5_000 }),
    );
    // The transcript shows which engine and model produced it.
    expect(await screen.findByTestId('engine-badge')).toHaveTextContent(
      'via Apple Speech (on-device)',
    );
  });

  it('shows an error with per-engine detail when every engine fails', async () => {
    const store = storeWithRecording();
    const router = makeFakeRouter({
      text: null,
      engine: null,
      notes: ['openai: HTTP 401', 'whisper: unavailable', 'apple: recognizer error: no-speech'],
    });
    await renderWithProviders(<RecordingDetailScreen />, { store, router });

    await screen.findByTestId('detail-loaded');
    await fireEvent.press(screen.getByTestId('transcribe'));

    expect(await screen.findByTestId('transcribe-error')).toBeTruthy();
    expect(screen.getByTestId('transcribe-error-detail')).toHaveTextContent(
      'openai: HTTP 401 · whisper: unavailable · apple: recognizer error: no-speech',
    );
    expect(store.setTranscript).not.toHaveBeenCalled();
  });

  it('copies an existing transcript to the clipboard', async () => {
    const recording = makeRecording({ id: 'r1', transcript: 'meeting notes here' });
    const store = makeFakeStore({ get: jest.fn().mockResolvedValue(recording) });
    await renderWithProviders(<RecordingDetailScreen />, { store });

    await screen.findByTestId('detail-loaded');
    await fireEvent.press(screen.getByTestId('copy'));

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('meeting notes here');
    expect(await screen.findByText('Copied')).toBeTruthy();
  });

  it('offers no copy action when there is no transcript', async () => {
    const store = storeWithRecording();
    await renderWithProviders(<RecordingDetailScreen />, { store });

    await screen.findByTestId('detail-loaded');
    expect(screen.queryByTestId('copy')).toBeNull();
  });

  it('exports the transcript to a PDF and shares it', async () => {
    const recording = makeRecording({ id: 'r1', transcript: 'exported transcript' });
    const store = makeFakeStore({ get: jest.fn().mockResolvedValue(recording) });
    await renderWithProviders(<RecordingDetailScreen />, { store });

    await screen.findByTestId('detail-loaded');
    await fireEvent.press(screen.getByTestId('export-pdf'));

    await waitFor(() => expect(Print.printToFileAsync).toHaveBeenCalled());
    const html = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain('exported transcript');
    await waitFor(() =>
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        'file:///tmp/transcript.pdf',
        expect.objectContaining({ mimeType: 'application/pdf' }),
      ),
    );
  });
});
