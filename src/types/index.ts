/**
 * Domain entity types — mirror the Supabase schema.
 * Keep in sync with /supabase/migrations.
 */

/** Supported locales for i18n JSONB fields. */
export type Locale = "it" | "en" | "ar";

/** A translatable text field stored as JSONB: { it, en, ar }. */
export type I18nText = Record<Locale, string>;

export type OrderStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "online";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type ComplaintStatus = "open" | "in_review" | "resolved" | "dismissed";

export interface ServiceCategory {
  id: string;
  name: I18nText;
  icon: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  category_id: string;
  name: I18nText;
  description: I18nText;
  base_price: number;
  price_unit: string;
  active: boolean;
  sort_order: number;
  image_path: string | null;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  city: string;
  active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  reference: string;
  service_id: string;
  zone_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  details: string | null;
  notes: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional joined data when selected with relations.
  service?: Pick<Service, "id" | "name" | "base_price" | "price_unit">;
  zone?: Pick<Zone, "id" | "name" | "city">;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string | null;
  at: string;
}

export interface Complaint {
  id: string;
  order_id: string;
  message: string;
  status: ComplaintStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  active: boolean;
  created_at: string;
}

/** Payload to create a new order (customer request). */
export interface NewOrderInput {
  service_id: string;
  zone_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  details?: string;
  notes?: string;
  payment_method?: PaymentMethod;
}
