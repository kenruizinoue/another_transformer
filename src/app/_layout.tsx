import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* The title names the back button target, never the "(tabs)" group. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Recordings' }} />
        <Stack.Screen
          name="record"
          options={{ presentation: 'modal', title: 'New recording', headerShadowVisible: false }}
        />
        {/* The recording's own title heads the screen, so the bar only holds a back chevron. */}
        <Stack.Screen
          name="recording/[id]"
          options={{ title: '', headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}
