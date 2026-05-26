import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()!,
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
}
