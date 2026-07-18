import { decode } from "base64-arraybuffer";

import { supabase } from "./supabase";

/**
 * Service image storage helpers.
 *
 * Images live in the public 'service-images' bucket. There is one LIVE object
 * per service, but each upload gets a fresh versioned path
 * ('services/<serviceId>-<timestamp>.jpg') so the public URL changes and
 * busts the Supabase CDN and client (expo-image) caches. The previous object
 * is deleted after a successful swap — see AdminServiceEditScreen. The
 * database stores only the object PATH (services.image_path), never a full
 * URL — URLs are derived at read time.
 */

export const SERVICE_IMAGES_BUCKET = "service-images";

/**
 * Fresh versioned object path for a service image upload. The timestamp
 * suffix guarantees a new URL per upload (cache busting); the old object is
 * cleaned up by the caller after the swap succeeds.
 */
export function serviceImagePath(serviceId: string): string {
  return `services/${serviceId}-${Date.now()}.jpg`;
}

/**
 * Resolve a stored object path to a public URL. Null-safe: returns null when
 * there is no image so callers can render a fallback.
 */
export function getServiceImageUrl(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath) return null;
  const { data } = supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .getPublicUrl(imagePath);
  return data.publicUrl ?? null;
}

/**
 * Upload a base64-encoded image for a service to a fresh versioned path and
 * return that path. upsert stays true (harmless — versioned paths never
 * collide in practice).
 */
export async function uploadServiceImage(
  serviceId: string,
  base64: string,
  contentType = "image/jpeg",
): Promise<string> {
  const path = serviceImagePath(serviceId);
  const { error } = await supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .upload(path, decode(base64), { contentType, upsert: true });
  if (error) throw error;
  return path;
}

/** Delete a service image object by its storage path. */
export async function deleteServiceImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .remove([path]);
  if (error) throw error;
}
