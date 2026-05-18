const axios = require('axios');

const TEXTMEBOT_API_KEY = 'c5A3asD4RNrv';
const TEXTMEBOT_API_URL = 'https://api.textmebot.com/send.php';

async function testWhatsAppService() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          🧪 TESTING WHATSAPP SERVICE                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Test 1: Send simple text message
  console.log('📱 Test 1: Sending text message...');
  try {
    const response = await axios.post(TEXTMEBOT_API_URL, null, {
      params: {
        recipient: '+923343717260',
        apikey: TEXTMEBOT_API_KEY,
        text: '🧪 Test message from WhatsApp Service\n\nThis is an automated test.',
      },
    });

    if (response.data && response.data.includes('Success')) {
      console.log('✅ Text message sent successfully!');
      console.log('Response:', response.data);
    } else {
      console.log('❌ Failed to send text message');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Error sending text message:', error.message);
  }

  console.log('\n' + '─'.repeat(70) + '\n');

  // Test 2: Send emergency alert format
  console.log('🚨 Test 2: Sending emergency alert...');
  try {
    const emergencyMessage =
      '🚨 *SILENT SIREN AI ALERT* 🚨\n\n' +
      '*Emergency Detected!*\n\n' +
      '*Threat Level:* HIGH\n' +
      '*Transcript:* "Help me please!"\n' +
      '*Reasoning:* Emergency keywords detected\n' +
      '*Confidence:* 95%\n\n' +
      '📍 *Location:*\n' +
      'Lat: 31.520370\n' +
      'Lng: 74.358749\n' +
      'https://maps.google.com/?q=31.520370,74.358749\n\n' +
      '⚠️ This is an automated alert from SilentSiren AI.\n' +
      'Please check on the person immediately.';

    const response = await axios.post(TEXTMEBOT_API_URL, null, {
      params: {
        recipient: '+923343717260',
        apikey: TEXTMEBOT_API_KEY,
        text: emergencyMessage,
      },
    });

    if (response.data && response.data.includes('Success')) {
      console.log('✅ Emergency alert sent successfully!');
      console.log('Response:', response.data);
    } else {
      console.log('❌ Failed to send emergency alert');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Error sending emergency alert:', error.message);
  }

  console.log('\n' + '─'.repeat(70) + '\n');

  // Test 3: Send contact form message
  console.log('📝 Test 3: Sending contact form message...');
  try {
    const contactFormMessage =
      '📝 *New Contact Form Submission*\n\n' +
      '*Name:* John Doe\n' +
      '*Email:* john@example.com\n' +
      '*Phone:* +92 300 1234567\n\n' +
      '*Message:*\n' +
      'I would like to know more about SilentSiren AI and how it can help protect my family.\n\n' +
      '_Sent via SilentSiren AI Contact Form_';

    const response = await axios.post(TEXTMEBOT_API_URL, null, {
      params: {
        recipient: '+923343717260',
        apikey: TEXTMEBOT_API_KEY,
        text: contactFormMessage,
      },
    });

    if (response.data && response.data.includes('Success')) {
      console.log('✅ Contact form message sent successfully!');
      console.log('Response:', response.data);
    } else {
      console.log('❌ Failed to send contact form message');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Error sending contact form message:', error.message);
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    ✅ TESTS COMPLETE                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📱 Check WhatsApp on +923343717260 for messages\n');
}

// Run tests
testWhatsAppService().catch(console.error);
