require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: coachAthletes } = await supabase.from('coach_athletes').select('*');
  console.log("Coach Athletes links:", coachAthletes);
  const { data: profiles } = await supabase.from('profiles').select('id, email, first_name, role, coach_id');
  console.log("Profiles coach_id:", profiles.map(p => ({ email: p.email, coach: p.coach_id, role: p.role })));
}
test();
