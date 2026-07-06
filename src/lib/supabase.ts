import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client.
 *
 * Reads credentials from public Expo env vars. The anon key is safe to ship:
 * every table is protected by Row-Level Security. Never put the service-role
 * key in the app.
 */
/** Trim whitespace, strip surrounding quotes, and drop trailing CR/LF/space. */
function normalizeEnv(value: string | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/[\r\n\s]+$/g, "");
}

const rawUrl = normalizeEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseUrl = rawUrl.replace(/\/+$/, "");
const supabaseAnonKey = normalizeEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl)) {
  throw new Error(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL is missing or invalid. " +
      "It must be a full URL starting with http(s)://. " +
      "Copy .env.example to .env and fill in your project credentials.",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. " +
      "Copy .env.example to .env and fill in your project credentials.",
  );
}

if (__DEV__) {
  // Log the final origin (protocol + host) only; drop any path/query so
  // nothing beyond the project ref host is exposed.
  const maskedUrl = supabaseUrl.replace(/^(https?:\/\/[^/]+).*$/, "$1");
  console.log(
    `[supabase] url=${maskedUrl} anonKeyLength=${supabaseAnonKey.length}`,
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
