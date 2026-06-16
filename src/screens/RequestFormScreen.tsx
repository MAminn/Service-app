import { Picker } from "@react-native-picker/picker";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import TextField from "../components/TextField";
import { ErrorView, Loading } from "../components/States";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { useZones } from "../hooks/useZones";
import { useLocalized } from "../i18n/useLocalized";
import { isValidEmail, isValidPhone } from "../lib/validation";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";
import type { Zone } from "../types";

interface Errors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  zone?: string;
}

export default function RequestFormScreen({
  route,
  navigation,
}: ScreenProps<"RequestForm">) {
  const { serviceId, serviceName } = route.params;
  const { t } = useTranslation();
  const localized = useLocalized();
  const { data: zones, isLoading, isError, refetch } = useZones();
  const createOrder = useCreateOrder();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [details, setDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("request.title") });
  }, [navigation, t]);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!name.trim()) next.name = t("request.errors.name");
    if (!isValidPhone(phone)) next.phone = t("request.errors.phone");
    if (!isValidEmail(email)) next.email = t("request.errors.email");
    if (!address.trim()) next.address = t("request.errors.address");
    if (!zoneId) next.zone = t("request.errors.zone");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = () => {
    setSubmitError(null);
    if (!validate()) return;

    createOrder.mutate(
      {
        service_id: serviceId,
        zone_id: zoneId,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        customer_address: address,
        details,
        notes,
      },
      {
        onSuccess: (order) =>
          navigation.replace("Confirmation", { reference: order.reference }),
        onError: () => setSubmitError(t("request.errors.submit")),
      },
    );
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps='handled'>
          <Text style={styles.service}>{localized(serviceName)}</Text>
          <Text style={styles.intro}>{t("request.intro")}</Text>

          <TextField
            label={t("request.name")}
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize='words'
            required
          />
          <TextField
            label={t("request.phone")}
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType='phone-pad'
            required
          />
          <TextField
            label={t("request.email")}
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType='email-address'
            autoCapitalize='none'
            required
          />
          <TextField
            label={t("request.address")}
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            required
          />

          <View style={styles.field}>
            <Text style={styles.label}>
              {t("request.zone")}
              <Text style={styles.req}> *</Text>
            </Text>
            <View
              style={[styles.pickerWrap, !!errors.zone && styles.pickerError]}>
              <Picker
                selectedValue={zoneId}
                onValueChange={(value) => setZoneId(value)}>
                <Picker.Item
                  label={t("common.select")}
                  value=''
                  color={theme.palette.textMuted}
                />
                {(zones ?? []).map((z: Zone) => (
                  <Picker.Item
                    key={z.id}
                    label={`${z.name} — ${z.city}`}
                    value={z.id}
                  />
                ))}
              </Picker>
            </View>
            {!!errors.zone && <Text style={styles.error}>{errors.zone}</Text>}
          </View>

          <TextField
            label={t("request.details")}
            value={details}
            onChangeText={setDetails}
            placeholder={t("request.detailsPlaceholder")}
            multiline
          />
          <TextField
            label={t("request.notes")}
            value={notes}
            onChangeText={setNotes}
            placeholder={t("request.notesPlaceholder")}
            multiline
          />

          {!!submitError && (
            <Text style={styles.submitError}>{submitError}</Text>
          )}

          <Button
            label={
              createOrder.isPending
                ? t("request.submitting")
                : t("request.submit")
            }
            onPress={onSubmit}
            loading={createOrder.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  flex: { flex: 1 },
  content: { padding: theme.spacing.lg },
  service: { ...theme.typography.h2, color: theme.palette.text },
  intro: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
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
    overflow: "hidden",
  },
  pickerError: { borderColor: theme.palette.danger },
  error: {
    ...theme.typography.caption,
    color: theme.palette.danger,
    marginTop: theme.spacing.xs,
  },
  submitError: {
    ...theme.typography.body,
    color: theme.palette.danger,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
});
