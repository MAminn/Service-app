/**
 * Centralized white-label theme.
 *
 * Final branding drops in here without touching any screen.
 * Screens must never hardcode colors, spacing, radii or font sizes —
 * always pull from this object.
 */

export const palette = {
  // Neutral white-label defaults. Swap these for real brand colors later.
  primary: "#1F6FEB",
  primaryDark: "#1A57B8",
  primaryContrast: "#FFFFFF",

  background: "#F6F7F9",
  surface: "#FFFFFF",
  border: "#E2E5EA",

  text: "#11151C",
  textMuted: "#5B6470",
  textInverse: "#FFFFFF",

  success: "#1A8754",
  warning: "#C77700",
  danger: "#D14343",

  // Order status colors (keyed by status value).
  statusPending: "#C77700",
  statusReviewing: "#1F6FEB",
  statusAccepted: "#1A8754",
  statusRejected: "#D14343",
  statusInProgress: "#6F42C1",
  statusCompleted: "#1A8754",
  statusCancelled: "#5B6470",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: "700" as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: "700" as const, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: "600" as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: "600" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: "600" as const, lineHeight: 20 },
} as const;

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export const theme = {
  palette,
  spacing,
  radius,
  typography,
  shadow,
} as const;

export type Theme = typeof theme;

export default theme;
