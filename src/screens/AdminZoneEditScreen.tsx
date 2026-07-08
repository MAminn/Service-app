import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import TextField from "../components/TextField";
import { ErrorView, Loading } from "../components/States";
import { useAdminZones } from "../hooks/useAdminCatalog";
import { useAuth, useIsAdmin } from "../hooks/useAuth";
import { useUpsertZone } from "../hooks/useCatalogMutations";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

interface Errors {
  name?: string;
  city?: string;
}

export default function AdminZoneEditScreen({
  navigation,
  route,
}: ScreenProps<"AdminZoneEdit">) {
  const zoneId = route.params?.zoneId;
  const { t } = useTranslation();
  const { session, isSessionLoading } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);
  const zones = useAdminZones();
  const upsert = useUpsertZone();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Errors>({});

  const isAuthorized = !!session && isAdminQuery.data === true;

  // Gate: only an authenticated active admin may stay on this screen.
  useEffect(() => {
    if (isSessionLoading) return;
    if (!session || isAdminQuery.data === false) {
      navigation.replace("AdminLogin");
    }
  }, [isSessionLoading, session, isAdminQuery.data, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: zoneId
        ? t("admin.catalog.zone.editTitle")
        : t("admin.catalog.zone.newTitle"),
    });
  }, [navigation, t, zoneId]);

  // Hydrate the form once from the existing row when editing.
  const hydrated = useRef(false);
  const existing = zoneId
    ? zones.data?.find((z) => z.id === zoneId)
    : undefined;
  useEffect(() => {
    if (!existing || hydrated.current) return;
    hydrated.current = true;
    setName(existing.name);
    setCity(existing.city);
    setActive(existing.active);
  }, [existing]);

  if (isSessionLoading || !isAuthorized) return <Loading />;
  if (zoneId && zones.isLoading) return <Loading />;
  if (zoneId && zones.isError) {
    return <ErrorView onRetry={zones.refetch} error={zones.error} />;
  }

  const validate = (): boolean => {
    const next: Errors = {};
    if (!name.trim()) next.name = t("admin.catalog.errors.zoneName");
    if (!city.trim()) next.city = t("admin.catalog.errors.city");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    upsert.mutate(
      {
        id: zoneId,
        name: name.trim(),
        city: city.trim(),
        active,
      },
      {
        onSuccess: () => {
          navigation.goBack();
          Alert.alert(t("admin.catalog.saved"));
        },
      },
    );
  };

  // Deactivating removes the zone from the customer request form picker.
  const onToggleActive = (next: boolean) => {
    if (next) {
      setActive(true);
      return;
    }
    Alert.alert(
      t("admin.catalog.deactivate.title"),
      t("admin.catalog.deactivate.zone"),
      [
        { text: t("admin.catalog.deactivate.cancel"), style: "cancel" },
        {
          text: t("admin.catalog.deactivate.confirm"),
          style: "destructive",
          onPress: () => setActive(false),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps='handled'>
          <TextField
            label={t("admin.catalog.fields.zoneName")}
            value={name}
            onChangeText={setName}
            error={errors.name}
            required
          />
          <TextField
            label={t("admin.catalog.fields.city")}
            value={city}
            onChangeText={setCity}
            error={errors.city}
            required
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>{t("admin.catalog.fields.active")}</Text>
            <Switch value={active} onValueChange={onToggleActive} />
          </View>

          {upsert.isError && (
            <Text style={styles.saveError}>
              {t("admin.catalog.errors.save")}
              {__DEV__ && upsert.error instanceof Error
                ? `\n${upsert.error.message}`
                : null}
            </Text>
          )}

          <Button
            label={
              upsert.isPending
                ? t("admin.catalog.saving")
                : t("admin.catalog.save")
            }
            onPress={onSave}
            loading={upsert.isPending}
            disabled={upsert.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  flex: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  label: {
    ...theme.typography.bodyStrong,
    color: theme.palette.text,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
  },
  saveError: {
    ...theme.typography.caption,
    color: theme.palette.danger,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
});
