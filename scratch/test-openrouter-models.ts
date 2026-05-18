import axios from 'axios';
import { config } from '../packages/config/src';

async function listModels() {
  try {
    const res = await axios.get('https://openrouter.ai/api/v1/models');
    const geminiModels = res.data.data
      .filter((m: any) => m.id.toLowerCase().includes('gemini'))
      .map((m: any) => m.id);
    console.log('Available Gemini Models on OpenRouter:', geminiModels);
  } catch (err: any) {
    console.error('Failed to list models:', err.message);
  }
}

listModels();
