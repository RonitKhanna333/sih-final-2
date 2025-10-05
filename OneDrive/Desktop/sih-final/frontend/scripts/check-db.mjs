// Test Supabase connection and check feedback count
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ibezvnwzacivmvqyqwcp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZXp2bnd6YWNpdm12cXlxd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NjQyMzcsImV4cCI6MjA3NTE0MDIzN30.UrMMSHD2olUdUMojHwVNqvgLPFabvx-mi3mreE9QxYI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('Connecting to Supabase...');
  
  const { data, error, count } = await supabase
    .from('Feedback')
    .select('*', { count: 'exact' });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`\n✅ Found ${data.length} feedback entries in database`);
  console.log(`\nFirst 3 entries:`);
  data.slice(0, 3).forEach((item, idx) => {
    console.log(`${idx + 1}. [${item.sentiment || 'N/A'}] ${item.text?.substring(0, 60)}...`);
  });
}

checkDatabase();
