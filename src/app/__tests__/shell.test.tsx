import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../(tabs)/index';
import SettingsScreen from '../(tabs)/settings';

describe('app shell', () => {
  it('home screen shows the recordings empty state and a record button', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Recordings')).toBeTruthy();
    expect(screen.getByTestId('recordings-empty')).toBeTruthy();
    expect(screen.getByText('No recordings yet')).toBeTruthy();
    expect(screen.getByTestId('new-recording')).toBeTruthy();
  });

  it('settings screen renders its about section', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('another_transformer')).toBeTruthy();
  });
});
