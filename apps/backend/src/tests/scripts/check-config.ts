import { config } from '../packages/config/src';

console.log('--- Config Test ---');
console.log('NODE_ENV:', config.NODE_ENV);
console.log('GEMINI_API_KEY length:', config.GEMINI_API_KEY?.length);
console.log('GEMINI_API_KEY preview:', config.GEMINI_API_KEY?.substring(0, 5) + '...');
console.log('TWILIO_ACCOUNT_SID:', config.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
console.log('--- End ---');
