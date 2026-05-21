require('dotenv').config();
const { Pool } = require('pg');

console.log('=== Testing Service Connections ===\n');

// Test 1: Check environment variables
console.log('1. Environment Variables:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Missing');
console.log('   OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✓ Set' : '✗ Missing');
console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
console.log('   FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✓ Set' : '✗ Missing');
console.log('');

// Test 2: Neon Database Connection
async function testDatabase() {
  console.log('2. Testing Neon Database Connection...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    console.log('   ✓ Database connected successfully');
    console.log('   Server time:', result.rows[0].now);
    console.log(
      '   PostgreSQL version:',
      result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    );

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('   Tables found:', tablesResult.rows.length);
    if (tablesResult.rows.length > 0) {
      console.log('   Table names:', tablesResult.rows.map((r) => r.table_name).join(', '));
    } else {
      console.log('   ⚠ No tables found - migration needed');
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.log('   ✗ Database connection failed:', error.message);
  }
  console.log('');
}

// Test 3: Gemini API
async function testGemini() {
  console.log('3. Testing Gemini API...');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Say "API working" in 2 words' }],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('   ✓ Gemini API working');
      console.log('   Response:', data.candidates[0].content.parts[0].text.trim());
    } else {
      const error = await response.text();
      console.log('   ✗ Gemini API failed:', response.status, error);
    }
  } catch (error) {
    console.log('   ✗ Gemini API error:', error.message);
  }
  console.log('');
}

// Test 4: OpenRouter API
async function testOpenRouter() {
  console.log('4. Testing OpenRouter API...');
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SilentSiren Test',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [{ role: 'user', content: 'Say "API working" in 2 words' }],
        max_tokens: 20,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✓ OpenRouter API working');
      console.log('   Response:', data.choices[0].message.content.trim());
    } else {
      const error = await response.text();
      console.log('   ✗ OpenRouter API failed:', response.status, error);
    }
  } catch (error) {
    console.log('   ✗ OpenRouter API error:', error.message);
  }
  console.log('');
}

// Run all tests
(async () => {
  await testDatabase();
  await testGemini();
  await testOpenRouter();
  console.log('=== Testing Complete ===');
})();
