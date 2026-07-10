import { screen } from '@testing-library/react-native';

import { renderWithStore } from '@/test-utils/store';

import HomeScreen from '../(tabs)/index';

describe('app smoke test', () => {
  it('renders the home screen without crashing', async () => {
    await renderWithStore(<HomeScreen />);
    expect(screen.getByText('Recordings')).toBeTruthy();
  });
});
