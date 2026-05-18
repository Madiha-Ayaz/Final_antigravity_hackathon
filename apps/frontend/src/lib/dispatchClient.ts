import { apiClient } from './api';
import { GPSCoordinates } from '@silentsiren/shared-types';

interface TrustedContact {
  name: string;
  phoneNumber: string;
  priority: number;
}

interface DispatchAlertRequest {
  eventId: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  gpsCoordinates: GPSCoordinates;
  audioUrl?: string;
  trustedContacts: TrustedContact[];
}

interface DispatchResult {
  phoneNumber: string;
  success: boolean;
  messageId?: string;
}

export async function dispatchEmergencyAlert(request: DispatchAlertRequest) {
  const response = await apiClient.post('/dispatch/alert', request);
  return response.data;
}

export async function verifyPhoneNumber(phoneNumber: string): Promise<boolean> {
  try {
    const response = await apiClient.post('/dispatch/verify-phone', { phoneNumber });
    return response.data.data.isValid;
  } catch (error) {
    console.error('Phone verification failed:', error);
    return false;
  }
}

export async function uploadAudioEvidence(audioBlob: Blob, eventId: string): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, `emergency-${eventId}.wav`);
  formData.append('eventId', eventId);

  const response = await apiClient.post('/emergency/upload-audio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.audioUrl;
}
