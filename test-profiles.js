require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  console.log("Total auth users:", users.users.length);
  const me = users.users.find(u => u.email === 'guillermo.haya@alumni.mondragon.edu');
  console.log("My auth ID:", me ? me.id : "Not found");

  const { data: profiles, error: dbError } = await supabase.from('profiles').select('*');
  console.log("Total profiles:", profiles.length);
  if (me) {
    const myProfile = profiles.find(p => p.id === me.id);
    console.log("My profile exists?", !!myProfile);
  }
}
test();
