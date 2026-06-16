import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import theme from "../theme/theme";

type Variant = "primary" | "secondary";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: Props) {
  const isPrimary = variant === "primary";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole='button'
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size='small'
            color={
              isPrimary ? theme.palette.primaryContrast : theme.palette.primary
            }
            style={styles.spinner}
          />
        )}
        <Text
          style={[
            styles.label,
            isPrimary ? styles.labelPrimary : styles.labelSecondary,
          ]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: theme.palette.primary },
  secondary: {
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.primary,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  content: { flexDirection: "row", alignItems: "center" },
  spinner: { marginEnd: theme.spacing.sm },
  label: { ...theme.typography.button },
  labelPrimary: { color: theme.palette.primaryContrast },
  labelSecondary: { color: theme.palette.primary },
});
