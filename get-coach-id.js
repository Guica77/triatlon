require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const me = users.users.find(u => u.email === 'guillermo.haya@alumni.mondragon.edu');
  if (me) {
    console.log("Tu ID de entrenador es:", me.id);
  } else {
    console.log("User not found!");
  }
}
test();
