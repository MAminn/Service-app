import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState, ErrorView, Loading } from "../components/States";
import { useServices } from "../hooks/useServices";
import { useLocalized } from "../i18n/useLocalized";
import { formatPrice } from "../lib/format";
import { getServiceImageUrl } from "../lib/catalogImages";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";
import type { Service } from "../types";

export default function ServicesScreen({
  route,
  navigation,
}: ScreenProps<"Services">) {
  const { categoryId, categoryName } = route.params;
  const { t, i18n } = useTranslation();
  const localized = useLocalized();
  const { data, isLoading, isError, refetch } = useServices(categoryId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: localized(categoryName) });
  }, [navigation, categoryName, localized]);

  const renderItem = ({ item }: { item: Service }) => {
    const imageUrl = getServiceImageUrl(item.image_path);
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() =>
          navigation.navigate("ServiceDetail", { serviceId: item.id })
        }>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            contentFit='cover'
            transition={200}
            cachePolicy='memory-disk'
          />
        ) : null}
        <View style={styles.cardRow}>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{localized(item.name)}</Text>
            <Text style={styles.price}>
              {t("services.priceFrom", {
                price: formatPrice(item.base_price, i18n.language),
                unit: item.price_unit,
              })}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
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
          ListEmptyComponent={<EmptyState message={t("services.empty")} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  list: { padding: theme.spacing.lg, gap: theme.spacing.md },
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
  cardBody: { flex: 1, gap: theme.spacing.xs },
  cardTitle: { ...theme.typography.h3, color: theme.palette.text },
  price: { ...theme.typography.body, color: theme.palette.primary },
  chevron: { ...theme.typography.h2, color: theme.palette.textMuted },
});
