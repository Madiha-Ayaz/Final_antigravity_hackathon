const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiKey() {
  const apiKey = 'AIzaSyC6cYGz-iPFARWRB5_QaptGhWeap5C0rzw';

  console.log('Testing Gemini API key...');
  console.log('API Key:', apiKey.substring(0, 10) + '...');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Try to list available models
    console.log('\nAttempting to list available models...');
    const models = await genAI.listModels();

    console.log('✅ API Key is VALID!');
    console.log('\nAvailable models:');
    for (const model of models) {
      console.log(`- ${model.name}`);
    }

    // Try the first available model
    if (models.length > 0) {
      const firstModel = models[0].name.replace('models/', '');
      console.log(`\nTesting with first available model: ${firstModel}`);
      const testModel = genAI.getGenerativeModel({ model: firstModel });
      const result = await testModel.generateContent('Say hello');
      const response = await result.response;
      console.log('Response:', response.text());
    }
  } catch (error) {
    console.log('\n❌ API Key is INVALID or has issues');
    console.log('Error:', error.message);
    console.log('\nPossible reasons:');
    console.log('1. API key is expired or revoked');
    console.log('2. API key is for a different Google service');
    console.log('3. Generative AI API is not enabled in Google Cloud Console');
    console.log('\nTo fix:');
    console.log('1. Go to https://aistudio.google.com/app/apikey');
    console.log('2. Create a new API key');
    console.log('3. Update GEMINI_API_KEY in your .env file');
  }
}

testGeminiKey();
