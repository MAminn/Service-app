import { Picker } from "@react-native-picker/picker";
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
import {
  useAdminCategories,
  useAdminServices,
} from "../hooks/useAdminCatalog";
import { useAuth, useIsAdmin } from "../hooks/useAuth";
import { useUpsertService } from "../hooks/useCatalogMutations";
import { useLocalized } from "../i18n/useLocalized";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

interface Errors {
  category?: string;
  nameIt?: string;
  price?: string;
}

export default function AdminServiceEditScreen({
  navigation,
  route,
}: ScreenProps<"AdminServiceEdit">) {
  const serviceId = route.params?.serviceId;
  const { t } = useTranslation();
  const localized = useLocalized();
  const { session, isSessionLoading } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);
  const categories = useAdminCategories();
  const services = useAdminServices();
  const upsert = useUpsertService();

  const [categoryId, setCategoryId] = useState("");
  const [nameIt, setNameIt] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descIt, setDescIt] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("fixed");
  const [sortOrder, setSortOrder] = useState("0");
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
      title: serviceId
        ? t("admin.catalog.service.editTitle")
        : t("admin.catalog.service.newTitle"),
    });
  }, [navigation, t, serviceId]);

  // Hydrate the form once from the existing row when editing.
  const hydrated = useRef(false);
  const existing = serviceId
    ? services.data?.find((s) => s.id === serviceId)
    : undefined;
  useEffect(() => {
    if (!existing || hydrated.current) return;
    hydrated.current = true;
    setCategoryId(existing.category_id);
    setNameIt(existing.name?.it ?? "");
    setNameEn(existing.name?.en ?? "");
    setNameAr(existing.name?.ar ?? "");
    setDescIt(existing.description?.it ?? "");
    setDescEn(existing.description?.en ?? "");
    setDescAr(existing.description?.ar ?? "");
    setPrice(String(existing.base_price));
    setPriceUnit(existing.price_unit);
    setSortOrder(String(existing.sort_order));
    setActive(existing.active);
  }, [existing]);

  if (isSessionLoading || !isAuthorized) return <Loading />;
  if (categories.isLoading || (serviceId && services.isLoading)) {
    return <Loading />;
  }
  if (categories.isError) {
    return <ErrorView onRetry={categories.refetch} error={categories.error} />;
  }
  if (serviceId && services.isError) {
    return <ErrorView onRetry={services.refetch} error={services.error} />;
  }

  const parsedPrice = Number(price.replace(",", "."));

  const validate = (): boolean => {
    const next: Errors = {};
    if (!categoryId) next.category = t("admin.catalog.errors.category");
    if (!nameIt.trim()) next.nameIt = t("admin.catalog.errors.nameIt");
    if (price.trim() === "" || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      next.price = t("admin.catalog.errors.price");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    upsert.mutate(
      {
        id: serviceId,
        category_id: categoryId,
        name: { it: nameIt.trim(), en: nameEn.trim(), ar: nameAr.trim() },
        description: {
          it: descIt.trim(),
          en: descEn.trim(),
          ar: descAr.trim(),
        },
        base_price: parsedPrice,
        price_unit: priceUnit.trim() || "fixed",
        sort_order: Number.parseInt(sortOrder, 10) || 0,
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

  // Deactivating hides the item from customers — confirm first.
  const onToggleActive = (next: boolean) => {
    if (next) {
      setActive(true);
      return;
    }
    Alert.alert(
      t("admin.catalog.deactivate.title"),
      t("admin.catalog.deactivate.service"),
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
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("admin.catalog.fields.category")}
              <Text style={styles.req}> *</Text>
            </Text>
            <View
              style={[
                styles.pickerWrap,
                !!errors.category && styles.pickerError,
              ]}>
              <Picker
                selectedValue={categoryId}
                onValueChange={(value) => setCategoryId(value)}>
                <Picker.Item
                  label={t("common.select")}
                  value=''
                  color={theme.palette.textMuted}
                />
                {(categories.data ?? []).map((c) => (
                  <Picker.Item
                    key={c.id}
                    label={localized(c.name)}
                    value={c.id}
                  />
                ))}
              </Picker>
            </View>
            {!!errors.category && (
              <Text style={styles.error}>{errors.category}</Text>
            )}
          </View>

          <TextField
            label={t("admin.catalog.fields.nameIt")}
            value={nameIt}
            onChangeText={setNameIt}
            error={errors.nameIt}
            required
          />
          <TextField
            label={t("admin.catalog.fields.nameEn")}
            value={nameEn}
            onChangeText={setNameEn}
          />
          <TextField
            label={t("admin.catalog.fields.nameAr")}
            value={nameAr}
            onChangeText={setNameAr}
          />

          <TextField
            label={t("admin.catalog.fields.descriptionIt")}
            value={descIt}
            onChangeText={setDescIt}
            multiline
          />
          <TextField
            label={t("admin.catalog.fields.descriptionEn")}
            value={descEn}
            onChangeText={setDescEn}
            multiline
          />
          <TextField
            label={t("admin.catalog.fields.descriptionAr")}
            value={descAr}
            onChangeText={setDescAr}
            multiline
          />

          <TextField
            label={t("admin.catalog.fields.basePrice")}
            value={price}
            onChangeText={setPrice}
            error={errors.price}
            keyboardType='phone-pad'
            required
          />
          <TextField
            label={t("admin.catalog.fields.priceUnit")}
            value={priceUnit}
            onChangeText={setPriceUnit}
            autoCapitalize='none'
          />
          <TextField
            label={t("admin.catalog.fields.sortOrder")}
            value={sortOrder}
            onChangeText={setSortOrder}
            keyboardType='phone-pad'
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>
              {t("admin.catalog.fields.active")}
            </Text>
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
  field: { marginBottom: theme.spacing.lg },
  label: {
    ...theme.typography.bodyStrong,
    color: theme.palette.text,
    marginBottom: theme.spacing.xs,
  },
  req: { color: theme.palette.danger },
  pickerWrap: {
    borderWidth: 1,
    borderColor: theme.palette.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.palette.surface,
  },
  pickerError: { borderColor: theme.palette.danger },
  error: {
    ...theme.typography.caption,
    color: theme.palette.danger,
    marginTop: theme.spacing.xs,
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
