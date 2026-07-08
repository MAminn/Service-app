import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import theme from "../theme/theme";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
  required?: boolean;
  secureTextEntry?: boolean;
}

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  required = false,
  secureTextEntry = false,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.req}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          !!error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.palette.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: theme.spacing.lg },
  label: {
    ...theme.typography.bodyStrong,
    color: theme.palette.text,
    marginBottom: theme.spacing.xs,
    writingDirection: "auto",
  },
  req: { color: theme.palette.danger },
  input: {
    ...theme.typography.body,
    color: theme.palette.text,
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    writingDirection: "auto",
  },
  multiline: { minHeight: 96 },
  inputError: { borderColor: theme.palette.danger },
  error: {
    ...theme.typography.caption,
    color: theme.palette.danger,
    marginTop: theme.spacing.xs,
  },
});
