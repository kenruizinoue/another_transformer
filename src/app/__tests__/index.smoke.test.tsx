import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../index';

describe('app smoke test', () => {
  it('renders the home screen without crashing', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('get started')).toBeTruthy();
  });
});
