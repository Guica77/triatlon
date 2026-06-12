import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('invite_code', 'TR-QFCMKX')
    .maybeSingle()
    
  console.log({ data, error })
}

test()
