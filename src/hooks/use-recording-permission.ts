import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';

export type RecordingPermissionStatus = 'undetermined' | 'granted' | 'denied';

function toStatus(res: {
  granted: boolean;
  canAskAgain: boolean;
}): RecordingPermissionStatus {
  if (res.granted) return 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * Tracks microphone permission for recording. Reads the current status on mount
 * and exposes a request() that prompts and returns the resulting status.
 */
export function useRecordingPermission() {
  const [status, setStatus] = useState<RecordingPermissionStatus>('undetermined');

  const refresh = useCallback(async () => {
    setStatus(toStatus(await getRecordingPermissionsAsync()));
  }, []);

  const request = useCallback(async (): Promise<RecordingPermissionStatus> => {
    const next = toStatus(await requestRecordingPermissionsAsync());
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    // Load the current permission status once on mount. State is set only after
    // the async check resolves, not synchronously during the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { status, request, refresh };
}
