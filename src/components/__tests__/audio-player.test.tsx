import { fireEvent, render, screen } from '@testing-library/react-native';

import { AudioPlayer } from '../audio-player';

describe('AudioPlayer', () => {
  it('shows a play control and formatted times when paused', async () => {
    await render(
      <AudioPlayer
        isPlaying={false}
        positionMs={2000}
        durationMs={65000}
        onToggle={jest.fn()}
        onSeek={jest.fn()}
      />,
    );

    expect(screen.getByText('Play')).toBeTruthy();
    expect(screen.getByText('0:02')).toBeTruthy();
    expect(screen.getByText('1:05')).toBeTruthy();
  });

  it('shows a pause control while playing and toggles on press', async () => {
    const onToggle = jest.fn();
    await render(
      <AudioPlayer
        isPlaying
        positionMs={0}
        durationMs={5000}
        onToggle={onToggle}
        onSeek={jest.fn()}
      />,
    );

    expect(screen.getByText('Pause')).toBeTruthy();
    fireEvent.press(screen.getByTestId('player-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
