import { fireEvent, render, screen } from '@testing-library/react-native';

import { AudioPlayer } from '../audio-player';

async function renderPlayer(props: Partial<React.ComponentProps<typeof AudioPlayer>> = {}) {
  const handlers = { onToggle: jest.fn(), onSeek: jest.fn() };
  await render(
    <AudioPlayer
      positionMs={2000}
      durationMs={65000}
      isPlaying={false}
      peaks={null}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('AudioPlayer', () => {
  it('shows the waveform and formatted times', async () => {
    await renderPlayer();

    expect(screen.getByTestId('player-scrub')).toBeTruthy();
    expect(screen.getByText('0:02')).toBeTruthy();
    expect(screen.getByText('1:05')).toBeTruthy();
  });

  it('labels the toggle for the current state', async () => {
    await renderPlayer({ isPlaying: true });

    expect(screen.getByLabelText('Pause')).toBeTruthy();
  });

  it('skips 5 seconds back and forward within the recording', async () => {
    const { onSeek } = await renderPlayer({ positionMs: 3000, durationMs: 6000 });

    await fireEvent.press(screen.getByTestId('player-back'));
    expect(onSeek).toHaveBeenLastCalledWith(0);
    await fireEvent.press(screen.getByTestId('player-forward'));
    expect(onSeek).toHaveBeenLastCalledWith(6000);
  });
});
