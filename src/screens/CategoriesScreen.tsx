import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import LanguageSwitcher from "../components/LanguageSwitcher";
import { EmptyState, ErrorView, Loading } from "../components/States";
import { useCategories } from "../hooks/useCategories";
import { useLocalized } from "../i18n/useLocalized";
import { getCatalogImageUrl } from "../lib/catalogImages";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";
import type { ServiceCategory } from "../types";

export default function CategoriesScreen({
  navigation,
}: ScreenProps<"Categories">) {
  const { t } = useTranslation();
  const localized = useLocalized();
  const { data, isLoading, isError, error, refetch } = useCategories();

  const renderItem = ({ item }: { item: ServiceCategory }) => {
    const imageUrl = getCatalogImageUrl(item.image_path);
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() =>
          navigation.navigate("Services", {
            categoryId: item.id,
            categoryName: item.name,
          })
        }>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : null}
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>{localized(item.name)}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>
    );
  };

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
        <ErrorView onRetry={refetch} error={error} />
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
      <Pressable
        style={styles.adminLink}
        onPress={() => navigation.navigate("AdminLogin")}
        hitSlop={theme.spacing.sm}>
        <Text style={styles.adminLinkText}>{t("admin.entry")}</Text>
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
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.palette.border,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  cardPressed: { opacity: 0.85 },
  cardImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: theme.palette.background,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
  },
  cardTitle: { ...theme.typography.h3, color: theme.palette.text, flex: 1 },
  chevron: { ...theme.typography.h2, color: theme.palette.textMuted },
  trackLink: { padding: theme.spacing.lg, alignItems: "center" },
  trackLinkText: {
    ...theme.typography.bodyStrong,
    color: theme.palette.primary,
  },
  adminLink: {
    alignItems: "center",
    paddingBottom: theme.spacing.md,
  },
  adminLinkText: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
  },
});
