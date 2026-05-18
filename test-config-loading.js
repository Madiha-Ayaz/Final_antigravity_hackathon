// Test if config is loading the API keys correctly
require('dotenv').config({ path: '.env' });

console.log('Environment variables check:');
console.log('================================');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 15)}... (length: ${process.env.GEMINI_API_KEY.length})` : 'NOT FOUND');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? `${process.env.OPENROUTER_API_KEY.substring(0, 15)}... (length: ${process.env.OPENROUTER_API_KEY.length})` : 'NOT FOUND');
console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL || 'NOT SET');
console.log('================================');

// Test with actual Gemini SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testWithLoadedConfig() {
  if (!process.env.GEMINI_API_KEY) {
    console.log('\n❌ GEMINI_API_KEY not loaded from .env file!');
    return;
  }

  console.log('\n✅ GEMINI_API_KEY loaded successfully');
  console.log('\nTesting API key with Gemini SDK...');

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent('Say hi');
    const response = await result.response;
    console.log('✅ API call successful!');
    console.log('Response:', response.text());
  } catch (error) {
    console.log('❌ API call failed!');
    console.log('Error:', error.message);

    if (error.message.includes('API key not valid')) {
      console.log('\n🔑 Solution: Generate a new API key from https://aistudio.google.com/app/apikey');
    }
  }
}

testWithLoadedConfig();
