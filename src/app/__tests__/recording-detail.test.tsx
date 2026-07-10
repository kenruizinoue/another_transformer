/* eslint-disable import/first -- jest.mock and its mock state must precede imports */
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'r1' }),
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { makeFakeStore, makeRecording, renderWithStore } from '@/test-utils/store';

import RecordingDetailScreen from '../recording/[id]';

function storeWithRecording(overrides = {}) {
  const recording = makeRecording({ id: 'r1', title: 'Old title' });
  return makeFakeStore({
    get: jest.fn().mockResolvedValue(recording),
    rename: jest.fn(async (_id, title) => ({ ...recording, title })),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

beforeEach(() => mockBack.mockClear());

describe('RecordingDetailScreen', () => {
  it('renames the recording', async () => {
    const store = storeWithRecording();
    await renderWithStore(<RecordingDetailScreen />, store);

    await screen.findByTestId('detail-loaded');
    await fireEvent.changeText(screen.getByTestId('rename-input'), 'Team sync');
    await fireEvent.press(screen.getByTestId('rename-save'));

    await waitFor(() => expect(store.rename).toHaveBeenCalledWith('r1', 'Team sync'));
  });

  it('rejects an empty title without calling the store', async () => {
    const store = storeWithRecording();
    await renderWithStore(<RecordingDetailScreen />, store);

    await screen.findByTestId('detail-loaded');
    await fireEvent.changeText(screen.getByTestId('rename-input'), '   ');
    await fireEvent.press(screen.getByTestId('rename-save'));

    expect(store.rename).not.toHaveBeenCalled();
  });

  it('deletes the recording and navigates back', async () => {
    const store = storeWithRecording();
    await renderWithStore(<RecordingDetailScreen />, store);

    await screen.findByTestId('detail-loaded');
    await fireEvent.press(screen.getByTestId('delete'));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(store.remove).toHaveBeenCalledWith('r1');
  });
});
