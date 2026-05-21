const GEMINI_KEY = 'AIzaSyDqFcImOSkhkUSsFq4AGW74C2JzjwY5W7g';

async function testKey() {
  console.log('Testing your Gemini API key...\n');
  console.log('Key:', GEMINI_KEY.substring(0, 20) + '...\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Say "working" if you can read this' }],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Your Gemini API key is WORKING!\n');
      console.log('Response:', data.candidates[0].content.parts[0].text);
      console.log('\n✅ Voice monitoring will work with this key!\n');
      return true;
    } else {
      const error = await response.json();
      console.log('❌ FAILED! Your Gemini API key is NOT working\n');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(error, null, 2));
      console.log('\n❌ Voice monitoring will NOT work with this key\n');

      if (error.error?.details) {
        console.log('Problem:', error.error.message);
        console.log('\nSolution: You need to create a NEW API key at:');
        console.log('https://aistudio.google.com/app/apikey\n');
      }
      return false;
    }
  } catch (err) {
    console.log('❌ Error testing key:', err.message);
    return false;
  }
}

testKey();
