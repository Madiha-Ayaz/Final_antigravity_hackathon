const GEMINI_KEY = 'AIzaSyDqFcImOSkhkUSsFq4AGW74C2JzjwY5W7g';

async function testWithDifferentVersions() {
  console.log('Testing Gemini API key with different versions...\n');
  
  // Test 1: List available models
  console.log('1. Checking available models...');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is VALID! Available models:');
      data.models.slice(0, 5).forEach(model => {
        console.log('   -', model.name);
      });
      console.log('');
    } else {
      console.log('❌ Cannot list models:', response.status);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  // Test 2: Try v1 API with gemini-1.5-flash
  console.log('2. Testing v1 API with gemini-1.5-flash...');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "working"' }]
          }]
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS with v1 API!');
      console.log('Response:', data.candidates[0].content.parts[0].text);
      console.log('');
      return 'v1';
    } else {
      console.log('❌ v1 API failed:', response.status);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  // Test 3: Try gemini-pro
  console.log('3. Testing with gemini-pro model...');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "working"' }]
          }]
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS with gemini-pro!');
      console.log('Response:', data.candidates[0].content.parts[0].text);
      console.log('');
      return 'gemini-pro';
    } else {
      console.log('❌ gemini-pro failed:', response.status);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  // Test 4: Try gemini-1.5-pro
  console.log('4. Testing with gemini-1.5-pro model...');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "working"' }]
          }]
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS with gemini-1.5-pro!');
      console.log('Response:', data.candidates[0].content.parts[0].text);
      console.log('');
      return 'gemini-1.5-pro';
    } else {
      console.log('❌ gemini-1.5-pro failed:', response.status);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  console.log('\n❌ None of the models worked with your key');
  console.log('You need to create a NEW API key at:');
  console.log('https://aistudio.google.com/app/apikey\n');
  return null;
}

testWithDifferentVersions();
