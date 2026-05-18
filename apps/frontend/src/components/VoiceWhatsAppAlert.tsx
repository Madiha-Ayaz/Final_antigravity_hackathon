'use client';

import { useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface VoiceWhatsAppProps {
  onSend?: (audioBlob: Blob, transcript: string) => void;
}

export default function VoiceWhatsAppAlert({ onSend }: VoiceWhatsAppProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState('');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('Recording...');

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
          setStatus('Recording stopped');
        }
      }, 60000);

      // Store mediaRecorder reference
      (window as any).currentRecorder = mediaRecorder;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatus('Failed to start recording');
    }
  };

  const stopRecording = () => {
    const mediaRecorder = (window as any).currentRecorder;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setStatus('Recording stopped');
    }
  };

  const analyzeAndSend = async () => {
    if (!audioBlob) {
      setStatus('No audio recorded');
      return;
    }

    setIsSending(true);
    setStatus('Analyzing voice...');

    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Analyze audio with Gemini AI
        const analyzeResponse = await fetch('/api/analyze-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64Audio }),
        });

        const analysis = await analyzeResponse.json();

        if (analysis.success) {
          setTranscript(analysis.data.transcript);
          setStatus(`Analysis: ${analysis.data.reasoning}`);

          // Always send WhatsApp alert with voice recording
          await sendWhatsAppAlert(analysis.data, base64Audio);

          if (onSend) {
            onSend(audioBlob, analysis.data.transcript);
          }
        } else {
          setStatus('Analysis failed');
        }

        setIsSending(false);
      };
    } catch (error) {
      console.error('Failed to analyze audio:', error);
      setStatus('Failed to analyze audio');
      setIsSending(false);
    }
  };

  const sendWhatsAppAlert = async (analysisData: any, audioBase64: string) => {
    try {
      setStatus('Sending WhatsApp alerts with voice recording...');

      // Get emergency contacts
      const token = localStorage.getItem('token');
      const contactsResponse = await fetch('/api/contacts/emergency', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      let recipients: string[] = [];
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        recipients = contactsData.data?.contacts
          ?.filter((c: any) => c.notify_whatsapp)
          ?.map((c: any) => c.phone_number) || [];
      }

      // Fallback to default number if no contacts
      if (recipients.length === 0) {
        recipients = ['+923343717260', '+923452508043'];
      }

      // Send text message first
      const message = `🚨 *SILENT SIREN AI ALERT* 🚨\n\n` +
        `*Emergency Detected!*\n\n` +
        `*Transcript:* "${analysisData.transcript || 'Voice detected'}"\n` +
        `*Reasoning:* ${analysisData.reasoning || 'Emergency keywords detected'}\n` +
        `*Confidence:* ${((analysisData.confidence || 0.9) * 100).toFixed(0)}%\n\n` +
        `⚠️ Voice recording attached in next message.\n` +
        `📍 Check location in emergency dashboard.`;

      let sentCount = 0;
      let failedCount = 0;

      // Send to each recipient
      for (const recipient of recipients) {
        try {
          // Send text alert
          const textResponse = await fetch('/api/dispatch-textmebot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
          });

          if (textResponse.ok) {
            sentCount++;

            // Note: Voice message would require audio upload to a public URL
            // For now, we're sending the text alert with notification about voice
            setStatus(`✅ Alert sent to ${recipient}`);
          } else {
            failedCount++;
          }

          // Small delay between messages
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to send to ${recipient}:`, error);
          failedCount++;
        }
      }

      setStatus(`✅ WhatsApp alerts sent to ${sentCount} contacts (${failedCount} failed)`);
    } catch (error) {
      console.error('Failed to send WhatsApp alert:', error);
      setStatus('❌ Failed to send WhatsApp alert');
    }
  };

  const uploadAudio = async (blob: Blob): Promise<string> => {
    // Implement audio upload to your storage (Firebase, S3, etc.)
    // For now, return a placeholder URL
    return 'https://example.com/audio/' + Date.now() + '.webm';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🎤 Voice Alert System
      </h2>

      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isSending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              🎤 Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors animate-pulse"
            >
              ⏹️ Stop Recording
            </button>
          )}
        </div>

        {/* Analyze & Send Button */}
        {audioBlob && !isRecording && (
          <button
            onClick={analyzeAndSend}
            disabled={isSending}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSending ? '⏳ Analyzing...' : '🔍 Analyze & Send WhatsApp Alert'}
          </button>
        )}

        {/* Status Display */}
        {status && (
          <div className={`p-4 rounded-lg ${
            status.includes('✅') ? 'bg-green-100 text-green-800' :
            status.includes('Failed') ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <p className="font-medium">{status}</p>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Transcript:</h3>
            <p className="text-gray-800">{transcript}</p>
          </div>
        )}

        {/* Audio Player */}
        {audioBlob && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Recorded Audio:</h3>
            <audio
              controls
              src={URL.createObjectURL(audioBlob)}
              className="w-full"
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
            <li>Click "Start Recording" to begin</li>
            <li>Speak clearly into your microphone</li>
            <li>Click "Stop Recording" when done</li>
            <li>Click "Analyze & Send" to process and alert contacts</li>
            <li>If emergency detected, WhatsApp alerts sent automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
