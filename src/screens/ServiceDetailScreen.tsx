import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import { ErrorView, Loading } from "../components/States";
import { useService } from "../hooks/useServices";
import { useLocalized } from "../i18n/useLocalized";
import { formatPrice } from "../lib/format";
import { getServiceImageUrl } from "../lib/serviceImages";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

export default function ServiceDetailScreen({
  route,
  navigation,
}: ScreenProps<"ServiceDetail">) {
  const { serviceId } = route.params;
  const { t, i18n } = useTranslation();
  const localized = useLocalized();
  const { data: service, isLoading, isError, refetch } = useService(serviceId);

  useLayoutEffect(() => {
    if (service) navigation.setOptions({ title: localized(service.name) });
  }, [navigation, service, localized]);

  if (isLoading) return <Loading />;
  if (isError || !service) return <ErrorView onRetry={refetch} />;

  const imageUrl = getServiceImageUrl(service.image_path);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit='cover'
            transition={200}
            cachePolicy='memory-disk'
          />
        ) : null}
        <Text style={styles.title}>{localized(service.name)}</Text>
        <Text style={styles.price}>
          {t("services.priceFrom", {
            price: formatPrice(service.base_price, i18n.language),
            unit: service.price_unit,
          })}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("serviceDetail.about")}</Text>
          <Text style={styles.description}>
            {localized(service.description)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t("serviceDetail.requestCta")}
          onPress={() =>
            navigation.navigate("RequestForm", {
              serviceId: service.id,
              serviceName: service.name,
              basePrice: service.base_price,
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  content: { padding: theme.spacing.lg },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.palette.surface,
    marginBottom: theme.spacing.lg,
  },
  title: { ...theme.typography.h1, color: theme.palette.text },
  price: {
    ...theme.typography.h3,
    color: theme.palette.primary,
    marginTop: theme.spacing.sm,
  },
  section: { marginTop: theme.spacing.xl },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.palette.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    writingDirection: "auto",
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.palette.border,
    backgroundColor: theme.palette.surface,
  },
});
