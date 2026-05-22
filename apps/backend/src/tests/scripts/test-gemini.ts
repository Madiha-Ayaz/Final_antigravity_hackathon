import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@silentsiren/config';

async function testGemini() {
  console.log('Testing Gemini with key length:', config.GEMINI_API_KEY?.length);
  try {
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    console.log('Success! Response:', response.text());
  } catch (err: any) {
    console.error('Failed! Error:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

testGemini();
