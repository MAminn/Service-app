import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LanguageSwitcher from "../components/LanguageSwitcher";
import { EmptyState, ErrorView, Loading } from "../components/States";
import { useCategories } from "../hooks/useCategories";
import { useLocalized } from "../i18n/useLocalized";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";
import type { ServiceCategory } from "../types";

export default function CategoriesScreen({
  navigation,
}: ScreenProps<"Categories">) {
  const { t } = useTranslation();
  const localized = useLocalized();
  const { data, isLoading, isError, refetch } = useCategories();

  const renderItem = ({ item }: { item: ServiceCategory }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        navigation.navigate("Services", {
          categoryId: item.id,
          categoryName: item.name,
        })
      }>
      <Text style={styles.cardTitle}>{localized(item.name)}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t("categories.title")}</Text>
          <LanguageSwitcher />
        </View>
        <Text style={styles.subtitle}>{t("categories.subtitle")}</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t("categories.empty")} />}
        />
      )}

      <Pressable
        style={styles.trackLink}
        onPress={() => navigation.navigate("TrackOrder")}>
        <Text style={styles.trackLinkText}>{t("track.title")}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...theme.typography.h1, color: theme.palette.text },
  subtitle: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.xs,
  },
  list: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.palette.border,
    ...theme.shadow.card,
  },
  cardPressed: { opacity: 0.85 },
  cardTitle: { ...theme.typography.h3, color: theme.palette.text, flex: 1 },
  chevron: { ...theme.typography.h2, color: theme.palette.textMuted },
  trackLink: { padding: theme.spacing.lg, alignItems: "center" },
  trackLinkText: {
    ...theme.typography.bodyStrong,
    color: theme.palette.primary,
  },
});
