import { createBrowserClient } from '@supabase/ssr';

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return null if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Return cached client if available
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}
