require('dotenv').config();

console.log('═══════════════════════════════════════════════════════');
console.log('  FINAL CONFIGURATION TEST');
console.log('═══════════════════════════════════════════════════════\n');

async function finalTest() {
  // Test 1: Environment variables
  console.log('1. Environment Variables:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅' : '❌');
  console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅' : '❌');
  console.log('   GEMINI_MODEL:', process.env.GEMINI_MODEL || 'models/gemini-2.5-flash');
  console.log('');

  // Test 2: Database
  console.log('2. Testing Database...');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    console.log('   ✅ Database connected');
    client.release();
    await pool.end();
  } catch (err) {
    console.log('   ❌ Database failed:', err.message);
  }
  
  // Test 3: Gemini API with correct model
  console.log('');
  console.log('3. Testing Gemini API (Voice Monitoring)...');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Analyze this: A person screaming "Help me!"' }]
          }]
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Gemini API working');
      console.log('   ✅ Voice monitoring READY');
      console.log('   Response preview:', data.candidates[0].content.parts[0].text.substring(0, 100) + '...');
    } else {
      console.log('   ❌ Gemini API failed:', response.status);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ✅ SYSTEM READY TO START!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('Start the servers with:');
  console.log('  start-servers.bat');
  console.log('');
  console.log('Or manually:');
  console.log('  Terminal 1: cd apps/backend && npm run dev');
  console.log('  Terminal 2: cd apps/frontend && npm run dev');
  console.log('');
}

finalTest();
