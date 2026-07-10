/* eslint-disable import/first -- jest.mock and its mock state must precede imports */
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'r1' }),
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  makeFakeRouter,
  makeFakeStore,
  makeRecording,
  renderWithProviders,
} from '@/test-utils/store';

import RecordingDetailScreen from '../recording/[id]';

function storeWithRecording(overrides = {}) {
  const recording = makeRecording({ id: 'r1', title: 'Old title' });
  return makeFakeStore({
    get: jest.fn().mockResolvedValue(recording),
    rename: jest.fn(async (_id, title) => ({ ...recording, title })),
    remove: jest.fn().mockResolvedValue(undefined),
    setTranscript: jest.fn(async (_id, transcript) => ({ ...recording, transcript })),
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
    await fireEvent.press(screen.getByTestId('rename-save'));

    await waitFor(() => expect(store.rename).toHaveBeenCalledWith('r1', 'Team sync'));
  });

  it('rejects an empty title without calling the store', async () => {
    const store = storeWithRecording();
    await renderWithProviders(<RecordingDetailScreen />, { store });

    await screen.findByTestId('detail-loaded');
    await fireEvent.changeText(screen.getByTestId('rename-input'), '   ');
    await fireEvent.press(screen.getByTestId('rename-save'));

    expect(store.rename).not.toHaveBeenCalled();
  });

  it('deletes the recording and navigates back', async () => {
    const store = storeWithRecording();
    await renderWithProviders(<RecordingDetailScreen />, { store });

    await screen.findByTestId('detail-loaded');
    await fireEvent.press(screen.getByTestId('delete'));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(store.remove).toHaveBeenCalledWith('r1');
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
  });

  it('shows an error when every engine fails', async () => {
    const store = storeWithRecording();
    const router = makeFakeRouter({ text: null, engine: null });
    await renderWithProviders(<RecordingDetailScreen />, { store, router });

    await screen.findByTestId('detail-loaded');
    await fireEvent.press(screen.getByTestId('transcribe'));

    expect(await screen.findByTestId('transcribe-error')).toBeTruthy();
    expect(store.setTranscript).not.toHaveBeenCalled();
  });
});
