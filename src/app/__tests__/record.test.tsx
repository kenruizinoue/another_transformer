import { act, fireEvent, screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';

import { makeFakeRecorder, renderWithProviders } from '@/test-utils/store';

import RecordScreen from '../record';

// The last options the screen handed to its native header.
function lastScreenOptions() {
  const calls = (Stack.Screen as unknown as jest.Mock).mock.calls;
  return calls[calls.length - 1][0].options;
}

describe('RecordScreen', () => {
  it('shows the recorder when permission is granted', async () => {
    const recorder = makeFakeRecorder({
      getPermission: jest.fn().mockResolvedValue('granted'),
    });
    await renderWithProviders(<RecordScreen />, { recorder });

    expect(await screen.findByTestId('record-ready')).toBeTruthy();
    expect(screen.getByTestId('record-toggle')).toBeTruthy();
    expect(screen.getByTestId('record-elapsed')).toHaveTextContent('0:00');
    expect(screen.getByLabelText('Start recording')).toBeTruthy();
    expect(screen.getByTestId('record-levels')).toBeTruthy();
  });

  it('shows the live state and blocks swiping the sheet away while recording', async () => {
    await renderWithProviders(<RecordScreen />);
    await screen.findByTestId('record-ready');
    expect(lastScreenOptions()).toMatchObject({ gestureEnabled: true });

    await act(() => fireEvent.press(screen.getByTestId('record-toggle')));

    expect(await screen.findByTestId('record-live')).toBeTruthy();
    expect(screen.getByLabelText('Stop recording')).toBeTruthy();
    // A swipe down would unmount the recorder and lose the take.
    expect(lastScreenOptions()).toMatchObject({ gestureEnabled: false });
  });

  it('shows a denied state with a path to Settings when permission is denied', async () => {
    const recorder = makeFakeRecorder({
      getPermission: jest.fn().mockResolvedValue('denied'),
    });
    await renderWithProviders(<RecordScreen />, { recorder });

    expect(await screen.findByTestId('record-denied')).toBeTruthy();
    expect(screen.getByTestId('open-settings')).toBeTruthy();
  });

  it('asks for permission when it is undetermined', async () => {
    const recorder = makeFakeRecorder({
      getPermission: jest.fn().mockResolvedValue('undetermined'),
    });
    await renderWithProviders(<RecordScreen />, { recorder });

    expect(await screen.findByTestId('record-request')).toBeTruthy();
    expect(screen.getByTestId('allow-microphone')).toBeTruthy();
  });
});
