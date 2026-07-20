import { useCallback, useEffect, useState } from 'react';

import type { RecorderPermission } from '@/lib/domain';
import { useRecorderGateway } from '@/lib/recorder-context';

export type RecordingPermissionStatus = RecorderPermission;

/**
 * Tracks microphone permission through the Recorder gateway. Reads the current
 * status on mount and exposes a request() that prompts and returns the result.
 */
export function useRecordingPermission() {
  const recorder = useRecorderGateway();
  const [status, setStatus] = useState<RecordingPermissionStatus>('undetermined');

  const refresh = useCallback(async () => {
    setStatus(await recorder.getPermission());
  }, [recorder]);

  const request = useCallback(async (): Promise<RecordingPermissionStatus> => {
    const next = await recorder.requestPermission();
    setStatus(next);
    return next;
  }, [recorder]);

  useEffect(() => {
    // Load the current permission status once on mount. State is set only after
    // the async check resolves, not synchronously during the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { status, request, refresh };
}
