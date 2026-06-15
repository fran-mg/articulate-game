import { useAutoUpdates } from "../hooks/useAutoUpdates";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { initDatabase } from "../utils/database";
// @ts-ignore: allow side-effect CSS import without module declarations
import "./global.css";

configureReanimatedLogger({ level: ReanimatedLogLevel.error, strict: false });

export default function RootLayout() {
  useAutoUpdates();

  const colorScheme = useColorScheme();

  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="decks/index"
            options={{ presentation: "modal" }}
          />

          {/* Dev routes will be accessible but hidden from normal UI */}
          <Stack.Screen name="(dev)" options={{ presentation: "modal" }} />

          {/* Game Routes */}
          <Stack.Screen name="game/settings/index" />
          <Stack.Screen
            name="game/play/index"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="game/round-summary/index"
            options={{ gestureEnabled: false, animation: "fade" }}
          />
          <Stack.Screen
            name="game/match-summary"
            options={{ gestureEnabled: false }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
