import { renderHook } from '@testing-library/react-native';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';

import { useExpoRecorder } from '../expo-recorder';

// expo-audio is auto-mocked from __mocks__/expo-audio.js; useAudioRecorder
// returns a shared mock recorder object we can assert against.
const nativeRecorder = (useAudioRecorder as unknown as () => Record<string, jest.Mock>)();

describe('useExpoRecorder (adapter boundary)', () => {
  it('prepares the audio session and native recorder', async () => {
    const { result } = await renderHook(() => useExpoRecorder());

    await result.current.prepare();

    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsRecording: true, allowsBackgroundRecording: true }),
    );
    expect(nativeRecorder.prepareToRecordAsync).toHaveBeenCalled();
  });

  it('starts and stops, resolving the captured uri', async () => {
    const { result } = await renderHook(() => useExpoRecorder());

    result.current.start();
    expect(nativeRecorder.record).toHaveBeenCalled();

    const uri = await result.current.stop();
    expect(nativeRecorder.stop).toHaveBeenCalled();
    expect(uri).toBe('file:///tmp/recording.wav');
  });

  it('maps permission results to gateway statuses', async () => {
    const { result } = await renderHook(() => useExpoRecorder());

    (getRecordingPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
      canAskAgain: true,
    });
    expect(await result.current.getPermission()).toBe('undetermined');

    (requestRecordingPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
      canAskAgain: false,
    });
    expect(await result.current.requestPermission()).toBe('denied');

    (getRecordingPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: true,
      canAskAgain: false,
    });
    expect(await result.current.getPermission()).toBe('granted');
  });
});
