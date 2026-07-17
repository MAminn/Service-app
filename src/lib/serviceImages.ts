import { decode } from "base64-arraybuffer";

import { supabase } from "./supabase";

/**
 * Service image storage helpers.
 *
 * Images live in the public 'service-images' bucket, one object per service
 * at 'services/<serviceId>.jpg'. The database stores only this object PATH
 * (services.image_path), never a full URL — URLs are derived at read time.
 */

export const SERVICE_IMAGES_BUCKET = "service-images";

/** Object path for a service's image. One object per service (overwritten). */
export function serviceImagePath(serviceId: string): string {
  return `services/${serviceId}.jpg`;
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
 * Upload (upsert) a base64-encoded image for a service. Overwrites the single
 * object for that service and returns its storage path.
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
