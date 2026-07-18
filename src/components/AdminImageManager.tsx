import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import Button from "./Button";
import { getCatalogImageUrl } from "../lib/catalogImages";
import theme from "../theme/theme";

interface Props {
  /** Stored storage object path of the current image (null = no image). */
  imagePath: string | null | undefined;
  /** False for unsaved entities — shows the save-first hint instead. */
  canEdit: boolean;
  /** Hint shown when canEdit is false (e.g. "Save first, then add an image"). */
  saveFirstHint: string;
  /**
   * Called with the picked image's base64 payload. The caller performs the
   * full swap (upload → RPC → old-object cleanup) and throws on failure.
   */
  onUpload: (base64: string) => Promise<void>;
  /** Called after the user confirms removal. Throws on failure. */
  onRemove: () => Promise<void>;
}

/**
 * Admin image management block shared by catalog edit screens: preview (or
 * placeholder), choose/replace + remove buttons, permission handling, busy
 * indicator, and error surface. Storage/RPC specifics stay in the screens.
 */
export default function AdminImageManager({
  imagePath,
  canEdit,
  saveFirstHint,
  onUpload,
  onRemove,
}: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentImageUrl = getCatalogImageUrl(imagePath);

  const onChooseImage = async () => {
    setError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("admin.catalog.image.permissionDenied"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) {
        setError(t("admin.catalog.image.uploadFailed"));
        return;
      }
      setBusy(true);
      await onUpload(asset.base64);
    } catch {
      setError(t("admin.catalog.image.uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onRemoveImage = () => {
    Alert.alert(
      t("admin.catalog.image.removeTitle"),
      t("admin.catalog.image.removeMessage"),
      [
        { text: t("admin.catalog.image.cancel"), style: "cancel" },
        {
          text: t("admin.catalog.image.removeConfirm"),
          style: "destructive",
          onPress: async () => {
            setError(null);
            setBusy(true);
            try {
              await onRemove();
            } catch {
              setError(t("admin.catalog.image.uploadFailed"));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{t("admin.catalog.image.title")}</Text>
      {canEdit ? (
        <>
          {currentImageUrl ? (
            <Image
              source={{ uri: currentImageUrl }}
              style={styles.imagePreview}
              contentFit='cover'
              transition={200}
              cachePolicy='memory-disk'
            />
          ) : (
            <View style={[styles.imagePreview, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>
                {t("admin.catalog.image.none")}
              </Text>
            </View>
          )}
          <View style={styles.imageActions}>
            <View style={styles.imageActionButton}>
              <Button
                label={
                  currentImageUrl
                    ? t("admin.catalog.image.replace")
                    : t("admin.catalog.image.choose")
                }
                onPress={onChooseImage}
                disabled={busy}
              />
            </View>
            {currentImageUrl ? (
              <View style={styles.imageActionButton}>
                <Button
                  label={t("admin.catalog.image.remove")}
                  onPress={onRemoveImage}
                  variant='secondary'
                  disabled={busy}
                />
              </View>
            ) : null}
          </View>
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator size='small' color={theme.palette.primary} />
              <Text style={styles.busyText}>
                {t("admin.catalog.image.uploading")}
              </Text>
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      ) : (
        <Text style={styles.hint}>{saveFirstHint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: theme.spacing.lg },
  label: {
    ...theme.typography.bodyStrong,
    color: theme.palette.text,
    marginBottom: theme.spacing.xs,
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.md,
    backgroundColor: theme.palette.surface,
    marginBottom: theme.spacing.md,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.palette.border,
  },
  placeholderText: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
  },
  imageActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  imageActionButton: { flex: 1 },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  busyText: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
  },
  error: {
    ...theme.typography.caption,
    color: theme.palette.danger,
    marginTop: theme.spacing.xs,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
  },
});
