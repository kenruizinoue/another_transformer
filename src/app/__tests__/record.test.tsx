import { screen } from '@testing-library/react-native';

import { makeFakeRecorder, renderWithProviders } from '@/test-utils/store';

import RecordScreen from '../record';

describe('RecordScreen', () => {
  it('shows the recorder when permission is granted', async () => {
    const recorder = makeFakeRecorder({
      getPermission: jest.fn().mockResolvedValue('granted'),
    });
    await renderWithProviders(<RecordScreen />, { recorder });

    expect(await screen.findByTestId('record-ready')).toBeTruthy();
    expect(screen.getByTestId('record-toggle')).toBeTruthy();
    expect(screen.getByTestId('record-elapsed')).toHaveTextContent('0:00');
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
