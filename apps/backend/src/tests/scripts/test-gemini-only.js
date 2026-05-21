require('dotenv').config();

async function testGemini() {
  console.log('Testing Gemini API...\n');

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('YOUR_NEW')) {
    console.log('❌ Gemini API key not set in .env file');
    console.log('Please update GEMINI_API_KEY in .env file\n');
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Respond with exactly: "API is working"' }],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini API is working!');
      console.log('Response:', data.candidates[0].content.parts[0].text.trim());
      console.log('\n🎉 You can now start the servers!\n');
    } else {
      const error = await response.text();
      console.log('❌ Gemini API failed:', response.status);
      console.log('Error:', error);
      console.log('\nPlease check your API key is correct\n');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testGemini();
