import { buildRecordingAudioMode } from '../audio-session';

// expo-audio is auto-mocked from __mocks__/expo-audio.js.

describe('buildRecordingAudioMode', () => {
  it('keeps recording alive in the background and while locked', () => {
    const mode = buildRecordingAudioMode();
    expect(mode.allowsRecording).toBe(true);
    expect(mode.allowsBackgroundRecording).toBe(true);
    expect(mode.shouldPlayInBackground).toBe(true);
    expect(mode.playsInSilentMode).toBe(true);
  });

  it('does not route recording playback through the earpiece', () => {
    expect(buildRecordingAudioMode().shouldRouteThroughEarpiece).toBe(false);
  });
});
