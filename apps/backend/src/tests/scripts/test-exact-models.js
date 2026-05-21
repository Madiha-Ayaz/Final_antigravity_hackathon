const GEMINI_KEY = 'AIzaSyDqFcImOSkhkUSsFq4AGW74C2JzjwY5W7g';

async function testExactModels() {
  console.log('Testing with EXACT model names from API...\n');

  const modelsToTest = [
    'models/gemini-2.5-flash',
    'models/gemini-2.0-flash-exp',
    'gemini-1.5-flash-8b',
  ];

  for (const model of modelsToTest) {
    console.log(`Testing ${model}...`);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Say "Voice monitoring is working"' }],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS with ${model}!`);
        console.log('Response:', data.candidates[0].content.parts[0].text.trim());
        console.log(`\n🎉 VOICE MONITORING WILL WORK!\n`);
        console.log(`Use this in .env file:`);
        console.log(`GEMINI_MODEL=${model}\n`);
        return model;
      } else {
        const errorText = await response.text();
        console.log(`❌ ${model} failed: ${response.status}`);
        if (response.status === 429) {
          console.log('   (Rate limited - try again in a moment)');
        }
      }
    } catch (err) {
      console.log(`❌ Error with ${model}:`, err.message);
    }
  }

  return null;
}

testExactModels();
