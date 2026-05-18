const GEMINI_KEY = 'AIzaSyDqFcImOSkhkUSsFq4AGW74C2JzjwY5W7g';

async function testNewModels() {
  console.log('Testing with NEW Gemini models...\n');
  
  const modelsToTest = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest'
  ];
  
  for (const model of modelsToTest) {
    console.log(`Testing ${model}...`);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Respond with exactly: "Voice monitoring ready"' }]
            }]
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS with ${model}!`);
        console.log('Response:', data.candidates[0].content.parts[0].text.trim());
        console.log(`\n🎉 Use this model: ${model}\n`);
        return model;
      } else {
        console.log(`❌ ${model} failed: ${response.status}`);
      }
    } catch (err) {
      console.log(`❌ Error with ${model}:`, err.message);
    }
  }
  
  return null;
}

testNewModels();
