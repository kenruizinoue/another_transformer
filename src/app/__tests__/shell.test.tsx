import { screen } from '@testing-library/react-native';

import { makeFakeStore, makeRecording, renderWithStore } from '@/test-utils/store';

import HomeScreen from '../(tabs)/index';
import SettingsScreen from '../(tabs)/settings';

describe('app shell', () => {
  it('home screen shows the recordings empty state and a record button', async () => {
    const store = makeFakeStore({ list: jest.fn().mockResolvedValue([]) });
    await renderWithStore(<HomeScreen />, store);

    expect(screen.getByText('Recordings')).toBeTruthy();
    expect(await screen.findByTestId('recordings-empty')).toBeTruthy();
    expect(screen.getByTestId('new-recording')).toBeTruthy();
  });

  it('home screen renders saved recordings', async () => {
    const store = makeFakeStore({
      list: jest
        .fn()
        .mockResolvedValue([makeRecording({ id: 'a', title: 'Team sync', durationMs: 65_000 })]),
    });
    await renderWithStore(<HomeScreen />, store);

    expect(await screen.findByTestId('recordings-list')).toBeTruthy();
    expect(screen.getByText('Team sync')).toBeTruthy();
    expect(screen.getByTestId('recording-row-a')).toBeTruthy();
  });

  it('settings screen renders its about section', async () => {
    await renderWithStore(<SettingsScreen />);

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('another_transformer')).toBeTruthy();
  });
});
