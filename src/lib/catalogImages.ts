import { decode } from "base64-arraybuffer";

import { supabase } from "./supabase";

/**
 * Catalog image storage helpers (services AND categories).
 *
 * All public catalog images live in the 'service-images' bucket under a
 * per-entity prefix ('services/...' or 'categories/...'). There is one LIVE
 * object per entity, but each upload gets a fresh versioned path
 * ('<kind>/<id>-<timestamp>.jpg') so the public URL changes and busts the
 * Supabase CDN and client (expo-image) caches. The previous object is deleted
 * by the caller after a successful swap — never before. The database stores
 * only the object PATH (image_path), never a full URL — URLs are derived at
 * read time.
 */

export const SERVICE_IMAGES_BUCKET = "service-images";

export type CatalogImageKind = "services" | "categories";

/**
 * Fresh versioned object path for a catalog image upload. The timestamp
 * suffix guarantees a new URL per upload (cache busting); the old object is
 * cleaned up by the caller after the swap succeeds.
 */
export function catalogImagePath(kind: CatalogImageKind, id: string): string {
  return `${kind}/${id}-${Date.now()}.jpg`;
}

/**
 * Resolve a stored object path to a public URL. Null-safe: returns null when
 * there is no image so callers can render a fallback.
 */
export function getCatalogImageUrl(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath) return null;
  const { data } = supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .getPublicUrl(imagePath);
  return data.publicUrl ?? null;
}

/**
 * Upload a base64-encoded image for a catalog entity to a fresh versioned
 * path and return that path. upsert stays true (harmless — versioned paths
 * never collide in practice).
 */
export async function uploadCatalogImage(
  kind: CatalogImageKind,
  id: string,
  base64: string,
  contentType = "image/jpeg",
): Promise<string> {
  const path = catalogImagePath(kind, id);
  const { error } = await supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .upload(path, decode(base64), { contentType, upsert: true });
  if (error) throw error;
  return path;
}

/** Delete a catalog image object by its storage path. */
export async function deleteCatalogImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .remove([path]);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// Backward-compatible service-specific wrappers (pre-categories API).
// ----------------------------------------------------------------------------

/** @see catalogImagePath */
export function serviceImagePath(serviceId: string): string {
  return catalogImagePath("services", serviceId);
}

/** @see getCatalogImageUrl */
export const getServiceImageUrl = getCatalogImageUrl;

/** @see uploadCatalogImage */
export function uploadServiceImage(
  serviceId: string,
  base64: string,
  contentType = "image/jpeg",
): Promise<string> {
  return uploadCatalogImage("services", serviceId, base64, contentType);
}

/** @see deleteCatalogImage */
export const deleteServiceImage = deleteCatalogImage;
