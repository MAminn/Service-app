import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import TextField from "../components/TextField";
import { fetchIsAdmin, isAdminKey, useAuth, useIsAdmin } from "../hooks/useAuth";
import { isNonEmpty, isValidEmail } from "../lib/validation";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

export default function AdminLoginScreen({
  navigation,
}: ScreenProps<"AdminLogin">) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { session, signInWithPassword, signOut } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in as an active admin (e.g. persisted session): skip login.
  useEffect(() => {
    if (!submitting && session && isAdminQuery.data === true) {
      navigation.replace("AdminOrders");
    }
  }, [submitting, session, isAdminQuery.data, navigation]);

  const onSubmit = async () => {
    const emailErr = isValidEmail(email) ? null : t("admin.login.errors.email");
    const passwordErr = isNonEmpty(password)
      ? null
      : t("admin.login.errors.password");
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;

    setFormError(null);
    setSubmitting(true);
    try {
      const { data, error } = await signInWithPassword(email, password);
      if (error || !data.user) {
        setFormError(t("admin.login.errors.invalid"));
        return;
      }

      const isAdmin = await queryClient.fetchQuery({
        queryKey: isAdminKey(data.user.id),
        queryFn: () => fetchIsAdmin(data.user.id),
      });

      if (!isAdmin) {
        await signOut();
        setFormError(t("admin.login.errors.unauthorized"));
        return;
      }

      navigation.replace("AdminOrders");
    } catch {
      setFormError(t("admin.login.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps='handled'>
        <Text style={styles.intro}>{t("admin.login.intro")}</Text>
        <TextField
          label={t("admin.login.email")}
          value={email}
          onChangeText={setEmail}
          error={emailError}
          keyboardType='email-address'
          autoCapitalize='none'
          required
        />
        <TextField
          label={t("admin.login.password")}
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          autoCapitalize='none'
          secureTextEntry
          required
        />
        {!!formError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}
        <Button
          label={
            submitting ? t("admin.login.signingIn") : t("admin.login.submit")
          }
          onPress={onSubmit}
          loading={submitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  content: { padding: theme.spacing.lg },
  intro: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginBottom: theme.spacing.lg,
  },
  errorBox: {
    backgroundColor: `${theme.palette.danger}1A`,
    borderWidth: 1,
    borderColor: theme.palette.danger,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.palette.danger,
    textAlign: "center",
  },
});
