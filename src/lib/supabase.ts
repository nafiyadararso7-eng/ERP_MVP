import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Supabase client — only fully initialized on the client side.
// On the server (SSR), we provide a minimal mock that won't crash.

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client

  const url = typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_SUPABASE_URL
    : undefined

  const key = typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_SUPABASE_ANON_KEY
    : undefined

  // Use a real URL or fall back — createClient requires valid HTTP URL
  const finalUrl = url && url.startsWith('http') ? url : 'https://placeholder.supabase.co'
  const finalKey = key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

  _client = createClient(finalUrl, finalKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
    },
  })

  return _client
}

export const supabase = getClient()
