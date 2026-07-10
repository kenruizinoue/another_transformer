/**
 * Global test setup. Mocks native-only animation modules that do not run in the
 * Jest environment so component smoke tests can render without a device. The
 * shipped react-native-reanimated Jest mock cannot be used here because it loads
 * react-native-worklets, which needs the native runtime.
 */

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 0, height: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    // Strip the `edges` prop so it is not forwarded to a plain View.
    SafeAreaView: ({ children, edges, ...props }: { children?: React.ReactNode; edges?: unknown }) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn?.(...args),
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView } = require('react-native');

  // A Keyframe whose chainable methods (duration, withCallback, ...) return the
  // same object, matching how the app builds entering animations.
  const makeChainable = () => {
    const kf: Record<string, unknown> = {};
    for (const method of ['duration', 'delay', 'withCallback', 'reduceMotion', 'randomizeDelay']) {
      kf[method] = () => kf;
    }
    return kf;
  };
  class Keyframe {
    constructor() {
      return makeChainable();
    }
  }

  // Easing.elastic(0.7)() and friends are only stored in ignored keyframe defs.
  const Easing = new Proxy(
    {},
    { get: () => (..._args: unknown[]) => () => 0 },
  );

  const Animated = {
    View,
    Text,
    Image,
    ScrollView,
    createAnimatedComponent: (component: unknown) => component,
  };

  return {
    __esModule: true,
    default: Animated,
    Easing,
    Keyframe,
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
    withTiming: (value: unknown) => value,
    withSpring: (value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (value: unknown) => value,
    withDelay: (_delay: unknown, value: unknown) => value,
    cancelAnimation: () => {},
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
  };
});
