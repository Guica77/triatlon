import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('coach_athletes')
    .select(`
      athlete_id,
      group_id,
      coach_groups(name)
    `)
    .limit(1)
  console.log('Data:', data)
  console.log('Error:', error)
}
run()
