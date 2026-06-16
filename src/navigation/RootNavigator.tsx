import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useTranslation } from "react-i18next";

import theme from "../theme/theme";
import CategoriesScreen from "../screens/CategoriesScreen";
import ConfirmationScreen from "../screens/ConfirmationScreen";
import RequestFormScreen from "../screens/RequestFormScreen";
import ServiceDetailScreen from "../screens/ServiceDetailScreen";
import ServicesScreen from "../screens/ServicesScreen";
import TrackOrderScreen from "../screens/TrackOrderScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.palette.surface },
        headerTintColor: theme.palette.primary,
        headerTitleStyle: { color: theme.palette.text },
        contentStyle: { backgroundColor: theme.palette.background },
      }}>
      <Stack.Screen
        name='Categories'
        component={CategoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='Services'
        component={ServicesScreen}
        options={{ title: t("services.title") }}
      />
      <Stack.Screen
        name='ServiceDetail'
        component={ServiceDetailScreen}
        options={{ title: t("serviceDetail.title") }}
      />
      <Stack.Screen
        name='RequestForm'
        component={RequestFormScreen}
        options={{ title: t("request.title") }}
      />
      <Stack.Screen
        name='Confirmation'
        component={ConfirmationScreen}
        options={{ title: t("confirmation.title") }}
      />
      <Stack.Screen
        name='TrackOrder'
        component={TrackOrderScreen}
        options={{ title: t("track.title") }}
      />
    </Stack.Navigator>
  );
}
