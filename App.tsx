import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Side-effect import initializes i18next before first render.
import i18n from "./src/i18n";
import { applyLayoutDirection } from "./src/i18n/rtl";
import { queryClient } from "./src/lib/queryClient";
import RootNavigator from "./src/navigation/RootNavigator";

// Align native layout direction (LTR/RTL) with the detected locale at startup.
applyLayoutDirection();

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar style='dark' />
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
