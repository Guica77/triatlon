import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const coachId = 'b50e5141-623e-43f9-b408-339e96f00bca'
  
  // 1. Get athlete links with group info
  const { data: roster, error: rosterError } = await supabase
    .from('coach_athletes')
    .select(`
      athlete_id
    `)
    .eq('coach_id', coachId)

  console.log("Roster:", roster, rosterError)

  if (!roster || roster.length === 0) {
    return { data: [] }
  }

  const athleteIds = roster.map(r => r.athlete_id)
  
  // 2. Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*, training_plans(id, name)')
    .in('id', athleteIds)
    
  console.log("Profiles:", profiles?.length, profilesError)
}
run()
