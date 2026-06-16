import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { I18nText } from "../types";

/**
 * Root stack route params. Catalog text is passed along so detail screens can
 * render immediately while their own query (if any) hydrates.
 */
export type RootStackParamList = {
  Categories: undefined;
  Services: { categoryId: string; categoryName: I18nText };
  ServiceDetail: { serviceId: string };
  RequestForm: { serviceId: string; serviceName: I18nText; basePrice: number };
  Confirmation: { reference: string };
  TrackOrder: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
