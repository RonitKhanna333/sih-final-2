/**
 * Seed script to populate feedback via Next.js API
 * This script adds sample feedback by calling your API endpoints
 * 
 * Usage: 
 * 1. Make sure dev server is running (npm run dev)
 * 2. Run: node scripts/seed-via-api.js
 */

// Sample feedback data
const sampleFeedback = [
  {
    text: 'This policy will greatly benefit small businesses by reducing compliance costs and administrative burden.',
    stakeholderType: 'Business Owner',
    sector: 'Business'
  },
  {
    text: 'I appreciate the government\'s effort in digital transformation. This makes services more accessible.',
    stakeholderType: 'Citizen',
    sector: 'Technology'
  },
  {
    text: 'The environmental impact assessment is insufficient. We need stricter regulations to protect natural resources.',
    stakeholderType: 'Environmental Activist',
    sector: 'Environment'
  },
  {
    text: 'Rural communities are not adequately represented in this policy. Internet connectivity remains a major barrier.',
    stakeholderType: 'Rural Representative',
    sector: 'Rural Development'
  },
  {
    text: 'Excellent initiative! The simplified filing process will save countless hours for startups and entrepreneurs.',
    stakeholderType: 'Startup Founder',
    sector: 'Business'
  },
  {
    text: 'Data privacy concerns are not addressed properly. We need clearer guidelines on personal information protection.',
    stakeholderType: 'Privacy Advocate',
    sector: 'Privacy'
  },
  {
    text: 'This is a step in the right direction, though implementation timelines could be more ambitious.',
    stakeholderType: 'Policy Analyst',
    sector: 'General'
  },
  {
    text: 'The consultation process itself is flawed. Not enough time given for stakeholder feedback.',
    stakeholderType: 'NGO Representative',
    sector: 'Community'
  },
  {
    text: 'Great to see transparency in governance. The portal makes it easy to track policy changes.',
    stakeholderType: 'Citizen',
    sector: 'Technology'
  },
  {
    text: 'Implementation costs for small businesses are not realistic. Need more financial support mechanisms.',
    stakeholderType: 'Business Owner',
    sector: 'Business'
  }
];

async function seedFeedback() {
  console.log('🌱 Starting to seed feedback data...\n');
  
  // First, try to login to get a token
  console.log('📝 Attempting to login...');
  
  let token = null;
  try {
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test1@gmail.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log('✅ Login successful\n');
    } else {
      console.log('⚠️  Login failed, will try without authentication\n');
    }
  } catch (error) {
    console.log('⚠️  Could not login, will try without authentication\n');
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < sampleFeedback.length; i++) {
    const feedback = sampleFeedback[i];
    console.log(`[${i + 1}/${sampleFeedback.length}] Adding: "${feedback.text.substring(0, 60)}..."`);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify(feedback)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Added successfully (ID: ${data.id})`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${response.status} - ${errorText.substring(0, 100)}`);
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully added: ${successCount} feedback entries`);
  console.log(`❌ Failed: ${failCount} feedback entries`);
  console.log('='.repeat(60));
  
  if (successCount > 0) {
    console.log('\n🎉 Seeding complete! Refresh your dashboard to see the data.');
  } else {
    console.log('\n⚠️  No feedback was added. Make sure:');
    console.log('   1. Dev server is running (npm run dev)');
    console.log('   2. Database connection is working');
    console.log('   3. You have restarted the server after the recent fixes');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/feedback');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking if dev server is running...\n');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Dev server is not running on http://localhost:3000');
    console.log('\n📌 Please start the server first:');
    console.log('   npm run dev\n');
    console.log('Then run this script again.\n');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  await seedFeedback();
})();
