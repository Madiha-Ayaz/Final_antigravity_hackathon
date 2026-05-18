import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { audio, mimeType } = await request.json();

    if (!audio) {
      return NextResponse.json(
        { success: false, error: 'Audio data is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    // Call Gemini 1.5 Flash using raw REST API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are a critical emergency audio analyst. Analyze the provided audio recording for any speech or background distress indicators.
Look for:
- Emergency words such as: "help", "danger", "scream", "save me", "please help", "fire", "police", "accident", "emergency".
- Sound of distress screaming, gasping, or intense crying.

Respond STRICTLY in JSON format with the following fields:
{
  "transcript": "Transcribe any spoken words, or specify '[no speech detected]'",
  "emergencyDetected": true/false (set to true if emergency words, screams, or acute distress is present),
  "confidence": 0.0 to 1.0 (certainty level),
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "reasoning": "A brief explanation of why this was or wasn't classified as an emergency"
}`;

    console.log('Sending audio segment to Gemini API...');
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: audio,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    const analysis = JSON.parse(responseText.trim());
    console.log('Gemini Analysis Result:', analysis);

    // If emergency is detected, trigger TextMeBot WhatsApp alert automatically!
    let alertSent = false;
    let alertResponse = null;

    if (analysis.emergencyDetected) {
      const textmebotApiKey = process.env.TEXTMEBOT_API_KEY;
      const recipient = process.env.TEXTMEBOT_RECIPIENT_PHONE;

      if (textmebotApiKey && recipient) {
        const cleanPhone = recipient.replace('+', '').replace(/\s+/g, '');
        const messageText = `🚨 *SILENT SIREN AI ALERT* 🚨\n\n*Emergency Detected!*\n\n*Threat Level:* ${analysis.threatLevel}\n*Transcript:* "${analysis.transcript}"\n*Reasoning:* ${analysis.reasoning}\n*Confidence:* ${(analysis.confidence * 100).toFixed(0)}%\n\n📍 _Live audio monitoring is active._`;
        
        try {
          const textmebotUrl = `https://api.textmebot.com/send.php?recipient=${cleanPhone}&apikey=${textmebotApiKey}&text=${encodeURIComponent(messageText)}&json=yes`;
          const alertRes = await fetch(textmebotUrl);
          const alertText = await alertRes.text();
          alertSent = true;
          try {
            alertResponse = JSON.parse(alertText);
          } catch {
            alertResponse = { status: alertText };
          }
          console.log('TextMeBot WhatsApp response:', alertResponse);
        } catch (alertErr: any) {
          console.error('Failed to trigger automatic TextMeBot WhatsApp alert:', alertErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      alertSent,
      alertResponse,
    });
  } catch (error: any) {
    console.error('Error in analyze-audio route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to analyze audio' },
      { status: 500 }
    );
  }
}
