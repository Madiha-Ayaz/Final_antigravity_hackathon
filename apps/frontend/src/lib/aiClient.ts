import { apiClient } from './api';
import { AIAnalysisResult } from '@silentsiren/shared-types';

export async function analyzeAudioWithAI(audioBlob: Blob): Promise<AIAnalysisResult> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64Audio = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const response = await apiClient.post('/ai/analyze-audio', {
    audioData: base64Audio,
    mimeType: audioBlob.type,
  });

  return response.data.data;
}

export async function testAIAnalysis(): Promise<AIAnalysisResult> {
  const response = await apiClient.post('/ai/test-analysis');
  return response.data.data;
}
