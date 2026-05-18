const GEMINI_KEY = 'AIzaSyDqFcImOSkhkUSsFq4AGW74C2JzjwY5W7g';

async function testCorrectFormat() {
  console.log('Testing correct model format...\n');
  
  // The model name in config should be just the model name
  // The URL construction adds the models/ prefix
  
  const modelName = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_KEY}`;
  
  console.log('Model name:', modelName);
  console.log('Full URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Analyze this audio: Person screaming "Help! Emergency!"' }]
        }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Voice monitoring will work!');
      console.log('Response:', data.candidates[0].content.parts[0].text.substring(0, 150));
      console.log('\n✅ Use this in .env: GEMINI_MODEL=gemini-2.5-flash');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Failed:', response.status);
      console.log('Error:', error);
      return false;
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

testCorrectFormat();
