import { render, screen } from '@testing-library/react-native';

import { AudioPlayer } from '../audio-player';

describe('AudioPlayer', () => {
  it('shows the scrubber and formatted times', async () => {
    await render(<AudioPlayer positionMs={2000} durationMs={65000} onSeek={jest.fn()} />);

    expect(screen.getByTestId('player-scrub')).toBeTruthy();
    expect(screen.getByText('0:02')).toBeTruthy();
    expect(screen.getByText('1:05')).toBeTruthy();
  });

  it('clamps the slider position to the duration', async () => {
    await render(<AudioPlayer positionMs={9000} durationMs={5000} onSeek={jest.fn()} />);

    expect(screen.getByTestId('player-scrub')).toHaveProp('value', 5000);
  });
});
