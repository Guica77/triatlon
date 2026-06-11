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
    console.log("Deleting broken user:", me.email);
    await supabase.auth.admin.deleteUser(me.id);
    console.log("Deleted!");
  }
}
test();
