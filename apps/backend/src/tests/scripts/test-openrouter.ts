import axios from 'axios';
import { config } from '@silentsiren/config';

async function testOpenRouter() {
  console.log('Testing OpenRouter key with max_tokens set...');
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: 'Say hello',
          },
        ],
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'SilentSiren AI',
        },
      }
    );
    console.log('Success! OpenRouter Response:', response.data.choices[0].message.content);
  } catch (err: any) {
    console.error('Failed! OpenRouter Error:', err.message);
    if (err.response) {
      console.error('Details:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

testOpenRouter();
