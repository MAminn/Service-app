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

import AdminImageManager from "../components/AdminImageManager";
import Button from "../components/Button";
import TextField from "../components/TextField";
import { ErrorView, Loading } from "../components/States";
import { useAdminCategories } from "../hooks/useAdminCatalog";
import { useAuth, useIsAdmin } from "../hooks/useAuth";
import {
  useSetCategoryImage,
  useUpsertCategory,
} from "../hooks/useCatalogMutations";
import {
  deleteCatalogImage,
  uploadCatalogImage,
} from "../lib/catalogImages";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

interface Errors {
  nameIt?: string;
}

export default function AdminCategoryEditScreen({
  navigation,
  route,
}: ScreenProps<"AdminCategoryEdit">) {
  const categoryId = route.params?.categoryId;
  const { t } = useTranslation();
  const { session, isSessionLoading } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);
  const categories = useAdminCategories();
  const upsert = useUpsertCategory();
  const setCategoryImage = useSetCategoryImage();

  const [nameIt, setNameIt] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [icon, setIcon] = useState("");
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
      title: categoryId
        ? t("admin.catalog.category.editTitle")
        : t("admin.catalog.category.newTitle"),
    });
  }, [navigation, t, categoryId]);

  // Hydrate the form once from the existing row when editing.
  const hydrated = useRef(false);
  const existing = categoryId
    ? categories.data?.find((c) => c.id === categoryId)
    : undefined;
  useEffect(() => {
    if (!existing || hydrated.current) return;
    hydrated.current = true;
    setNameIt(existing.name?.it ?? "");
    setNameEn(existing.name?.en ?? "");
    setNameAr(existing.name?.ar ?? "");
    setIcon(existing.icon ?? "");
    setSortOrder(String(existing.sort_order));
    setActive(existing.active);
  }, [existing]);

  if (isSessionLoading || !isAuthorized) return <Loading />;
  if (categoryId && categories.isLoading) return <Loading />;
  if (categoryId && categories.isError) {
    return <ErrorView onRetry={categories.refetch} error={categories.error} />;
  }

  const validate = (): boolean => {
    const next: Errors = {};
    if (!nameIt.trim()) next.nameIt = t("admin.catalog.errors.nameIt");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    upsert.mutate(
      {
        id: categoryId,
        name: { it: nameIt.trim(), en: nameEn.trim(), ar: nameAr.trim() },
        icon: icon.trim() || null,
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

  // Upload to a fresh versioned path, point the DB at it, and only then
  // clean up the previous object. A failure before the swap completes must
  // never delete the image customers currently see.
  const onUploadImage = async (base64: string) => {
    if (!categoryId) return;
    const previousPath = existing?.image_path ?? null;
    const path = await uploadCatalogImage("categories", categoryId, base64);
    await setCategoryImage.mutateAsync({ categoryId, imagePath: path });
    if (previousPath && previousPath !== path) {
      try {
        await deleteCatalogImage(previousPath);
      } catch {
        // Ignore: the swap already succeeded; a leaked old object is
        // harmless, but surfacing an error here would mislead the admin.
      }
    }
  };

  const onRemoveImage = async () => {
    if (!categoryId) return;
    // Paths are versioned, so only the stored image_path identifies the
    // current object — never recompute it.
    const currentPath = existing?.image_path;
    if (currentPath) await deleteCatalogImage(currentPath);
    await setCategoryImage.mutateAsync({ categoryId, imagePath: null });
  };

  // Deactivating hides the category (and its services) from customers.
  const onToggleActive = (next: boolean) => {
    if (next) {
      setActive(true);
      return;
    }
    Alert.alert(
      t("admin.catalog.deactivate.title"),
      t("admin.catalog.deactivate.category"),
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
          <AdminImageManager
            imagePath={existing?.image_path}
            canEdit={!!categoryId}
            saveFirstHint={t("admin.catalog.image.saveFirstCategory")}
            onUpload={onUploadImage}
            onRemove={onRemoveImage}
          />

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
            label={t("admin.catalog.fields.icon")}
            value={icon}
            onChangeText={setIcon}
            autoCapitalize='none'
          />
          <TextField
            label={t("admin.catalog.fields.sortOrder")}
            value={sortOrder}
            onChangeText={setSortOrder}
            keyboardType='phone-pad'
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
