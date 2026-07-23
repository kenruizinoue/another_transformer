import { act, render, screen } from '@testing-library/react-native';

import { Snackbar } from '../snackbar';

describe('Snackbar', () => {
  it('renders nothing without a message', async () => {
    await render(<Snackbar message={null} onDismiss={jest.fn()} />);
    expect(screen.queryByTestId('snackbar')).toBeNull();
  });

  it('shows the message', async () => {
    await render(<Snackbar message="Key missing" onDismiss={jest.fn()} />);
    expect(screen.getByTestId('snackbar')).toBeTruthy();
    expect(screen.getByText('Key missing')).toBeTruthy();
  });

  it('auto-dismisses after its duration', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    await render(<Snackbar message="Bye soon" onDismiss={onDismiss} durationMs={3000} />);

    await act(async () => {
      jest.advanceTimersByTime(3100);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
