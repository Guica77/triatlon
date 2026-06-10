require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('Creating demo users...');

  const users = [
    { email: 'coach-demo@triatlonpro.com', role: 'coach', firstName: 'Demo', lastName: 'Entrenador' },
    { email: 'demo@triatlonpro.com', role: 'athlete', firstName: 'Demo', lastName: 'Atleta' }
  ];

  for (const user of users) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'demo123456',
      email_confirm: true,
      user_metadata: { role: user.role }
    });

    if (authError) {
      if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
        console.log(`User ${user.email} already exists. Ensuring email is confirmed...`);
        // Find user by email to confirm
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData.users.find(u => u.email === user.email);
        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
          console.log(`Email confirmed for ${user.email}.`);
        }
      } else {
        console.error('Error creating user:', authError);
      }
    } else {
      console.log(`User created: ${user.email}`);
      
      // Insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          level: 'intermedio',
          email: user.email,
          role: user.role,
        });
        
      if (profileError) {
        console.error('Profile error:', profileError);
      } else {
        console.log(`Profile created for ${user.email}`);
      }
    }
  }
}

main().catch(console.error);
