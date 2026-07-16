import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useTranslation } from "react-i18next";

import theme from "../theme/theme";
import AdminCatalogScreen from "../screens/AdminCatalogScreen";
import AdminCategoryEditScreen from "../screens/AdminCategoryEditScreen";
import AdminComplaintDetailScreen from "../screens/AdminComplaintDetailScreen";
import AdminComplaintsScreen from "../screens/AdminComplaintsScreen";
import AdminLoginScreen from "../screens/AdminLoginScreen";
import AdminOrderDetailScreen from "../screens/AdminOrderDetailScreen";
import AdminOrdersScreen from "../screens/AdminOrdersScreen";
import AdminServiceEditScreen from "../screens/AdminServiceEditScreen";
import AdminZoneEditScreen from "../screens/AdminZoneEditScreen";
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
      <Stack.Screen
        name='AdminLogin'
        component={AdminLoginScreen}
        options={{ title: t("admin.login.title") }}
      />
      {/*
        AdminOrders / AdminOrderDetail gate themselves: each redirects to
        AdminLogin unless there is an authenticated active-admin session.
        Server-side, RLS (is_admin()) is the actual enforcement.
      */}
      <Stack.Screen
        name='AdminOrders'
        component={AdminOrdersScreen}
        options={{ title: t("admin.orders.title") }}
      />
      <Stack.Screen
        name='AdminOrderDetail'
        component={AdminOrderDetailScreen}
        options={{ title: t("admin.orderDetail.title") }}
      />
      <Stack.Screen
        name='AdminCatalog'
        component={AdminCatalogScreen}
        options={{ title: t("admin.catalog.title") }}
      />
      <Stack.Screen
        name='AdminServiceEdit'
        component={AdminServiceEditScreen}
        options={{ title: t("admin.catalog.service.editTitle") }}
      />
      <Stack.Screen
        name='AdminCategoryEdit'
        component={AdminCategoryEditScreen}
        options={{ title: t("admin.catalog.category.editTitle") }}
      />
      <Stack.Screen
        name='AdminZoneEdit'
        component={AdminZoneEditScreen}
        options={{ title: t("admin.catalog.zone.editTitle") }}
      />
      <Stack.Screen
        name='AdminComplaints'
        component={AdminComplaintsScreen}
        options={{ title: t("admin.complaints.title") }}
      />
      <Stack.Screen
        name='AdminComplaintDetail'
        component={AdminComplaintDetailScreen}
        options={{ title: t("admin.complaints.detailTitle") }}
      />
    </Stack.Navigator>
  );
}
