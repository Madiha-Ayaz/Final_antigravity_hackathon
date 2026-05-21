import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Message text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TEXTMEBOT_API_KEY;
    const recipient = process.env.TEXTMEBOT_RECIPIENT_PHONE;

    if (!apiKey || !recipient) {
      console.error('TextMeBot keys are not configured in environment variables');
      return NextResponse.json(
        { success: false, error: 'TextMeBot API key or recipient phone is not configured' },
        { status: 500 }
      );
    }

    // Clean phone number (remove +, spaces, etc.)
    const cleanPhone = recipient.replace('+', '').replace(/\s+/g, '');
    const url = `https://api.textmebot.com/send.php?recipient=${cleanPhone}&apikey=${apiKey}&text=${encodeURIComponent(text)}&json=yes`;

    console.log(`Forwarding WhatsApp dispatch to TextMeBot: recipient=${cleanPhone}`);
    const res = await fetch(url, { method: 'GET' });

    // Fallback if TextMeBot returns text instead of json
    const responseText = await res.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { status: responseText };
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error dispatching TextMeBot alert:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch alert' },
      { status: 500 }
    );
  }
}
