require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.auth.admin.listUsers();
  const user = data.users.find(u => u.email === 'guillermo.haya@alumni.mondragon.edu');
  if (user) {
    console.log("User found:", user.email);
    console.log("Email confirmed at:", user.email_confirmed_at);
    
    if (!user.email_confirmed_at) {
      console.log("Auto-confirming email now...");
      await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
      console.log("Email confirmed manually!");
    }
  } else {
    console.log("User not found!");
  }
}
test();
