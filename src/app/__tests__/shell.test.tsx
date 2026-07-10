import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../index';
import SettingsScreen from '../settings';

describe('app shell', () => {
  it('home screen shows the recordings empty state', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Recordings')).toBeTruthy();
    expect(screen.getByTestId('recordings-empty')).toBeTruthy();
    expect(screen.getByText('No recordings yet')).toBeTruthy();
  });

  it('settings screen renders its about section', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('another_transformer')).toBeTruthy();
  });
});
