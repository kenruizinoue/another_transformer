import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../(tabs)/settings';

beforeEach(async () => {
  await AsyncStorage.clear();
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
