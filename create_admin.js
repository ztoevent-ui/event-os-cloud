const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'conniewongconnie@hotmail.com';
  const password = '123456';

  console.log('Signing up user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  console.log('User signed up successfully. Attempting to log in to update role...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  const userId = signInData.user.id;
  console.log(`User logged in with ID: ${userId}. Updating role to admin...`);

  // Try updating own profile to admin
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)
    .select();

  if (updateError) {
    console.error('Update role error:', updateError);
  } else {
    console.log('Role updated to admin successfully:', updateData);
  }
}

createAdmin();
