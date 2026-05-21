// Test TextMeBot WhatsApp API directly
const TEXTMEBOT_API_KEY = 'c5A3asD4RNrv';
const RECIPIENT_PHONE = '+923343717260';

async function testTextMeBot() {
  console.log('Testing TextMeBot WhatsApp API...\n');
  console.log('API Key:', TEXTMEBOT_API_KEY);
  console.log('Recipient:', RECIPIENT_PHONE);
  console.log('');

  const cleanPhone = RECIPIENT_PHONE.replace('+', '').replace(/\s+/g, '');
  const testMessage =
    '🚨 TEST ALERT from SilentSiren AI\n\nThis is a test message to verify WhatsApp integration is working.\n\nTime: ' +
    new Date().toLocaleString();

  const url = `https://api.textmebot.com/send.php?recipient=${cleanPhone}&apikey=${TEXTMEBOT_API_KEY}&text=${encodeURIComponent(testMessage)}`;

  console.log('Sending test message...');
  console.log('Clean Phone:', cleanPhone);
  console.log('');

  try {
    const response = await fetch(url);
    const text = await response.text();

    console.log('Response Status:', response.status);
    console.log('Response:', text);
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS! Check WhatsApp on', RECIPIENT_PHONE);
    } else {
      console.log('❌ FAILED! Status:', response.status);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

testTextMeBot();
