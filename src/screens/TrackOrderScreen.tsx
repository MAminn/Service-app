import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import TextField from "../components/TextField";
import { EmptyState } from "../components/States";
import { useTrackOrders, type TrackedOrder } from "../hooks/useTrackOrders";
import { useLocalized } from "../i18n/useLocalized";
import { formatDate } from "../lib/format";
import { isValidPhone } from "../lib/validation";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

export default function TrackOrderScreen({
  navigation,
}: ScreenProps<"TrackOrder">) {
  const { t, i18n } = useTranslation();
  const localized = useLocalized();
  const track = useTrackOrders();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("track.title") });
  }, [navigation, t]);

  const onSearch = () => {
    if (!isValidPhone(phone)) {
      setError(t("request.errors.phone"));
      return;
    }
    setError(null);
    track.mutate(phone, { onSuccess: () => setSearched(true) });
  };

  const orders = track.data ?? [];

  const renderItem = ({ item }: { item: TrackedOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.reference}>{item.reference}</Text>
        <StatusBadge status={item.status} />
      </View>
      {item.service_name && (
        <Text style={styles.service}>{localized(item.service_name)}</Text>
      )}
      <Text style={styles.date}>
        {t("track.placedOn", {
          date: formatDate(item.created_at, i18n.language),
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps='handled'
        ListHeaderComponent={
          <View>
            <Text style={styles.intro}>{t("track.intro")}</Text>
            <TextField
              label={t("track.phone")}
              value={phone}
              onChangeText={setPhone}
              error={error}
              keyboardType='phone-pad'
            />
            <Button
              label={track.isPending ? t("track.searching") : t("track.search")}
              onPress={onSearch}
              loading={track.isPending}
            />
            {orders.length > 0 && (
              <Text style={styles.listTitle}>{t("track.yourOrders")}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          searched && !track.isPending ? (
            <EmptyState message={t("track.empty")} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  list: { padding: theme.spacing.lg, gap: theme.spacing.md },
  intro: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginBottom: theme.spacing.lg,
  },
  listTitle: {
    ...theme.typography.h3,
    color: theme.palette.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.palette.border,
    ...theme.shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reference: { ...theme.typography.bodyStrong, color: theme.palette.text },
  service: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.sm,
  },
  date: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.xs,
  },
});
