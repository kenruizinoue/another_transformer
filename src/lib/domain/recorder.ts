export type RecorderPermission = 'undetermined' | 'granted' | 'denied';

/**
 * Audio capture gateway. Hooks depend on this, never on the native audio
 * module, so recording is swappable and hook tests inject fakes.
 */
export interface Recorder {
  getPermission(): Promise<RecorderPermission>;
  requestPermission(): Promise<RecorderPermission>;
  /** Configure the audio session (background capable) and prepare capture. */
  prepare(): Promise<void>;
  start(): void;
  /** Stop capturing and resolve the recorded file uri, or null when none. */
  stop(): Promise<string | null>;
  /** How loud the input is right now, from 0 to 1, or null when unknown. */
  level(): number | null;
}
