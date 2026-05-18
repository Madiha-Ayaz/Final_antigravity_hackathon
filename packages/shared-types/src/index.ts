export interface User {
  id: string;
  phoneNumber: string;
  deviceFingerprint?: string;
  isVerified: boolean;
  trustedContacts: TrustedContact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustedContact {
  id: string;
  name: string;
  phoneNumber: string;
  priority: number;
  userId: string;
}

export interface EmergencyEvent {
  id: string;
  userId: string;
  audioUrl: string;
  audioBuffer?: ArrayBuffer;
  gpsCoordinates: GPSCoordinates;
  timestamp: Date;
  aiAnalysis: AIAnalysisResult;
  status: EmergencyStatus;
  dispatchedAt?: Date;
  cancelledAt?: Date;
  verifiedBy?: string;
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface AIAnalysisResult {
  confidence: number;
  threatLevel: ThreatLevel;
  reasoning: string;
  dispatchRecommended: boolean;
  detectedPatterns: string[];
  emotionalStress: number;
  audioFeatures: AudioFeatures;
}

export interface AudioFeatures {
  hasScream: boolean;
  hasPanic: boolean;
  hasImpactSound: boolean;
  breathingPattern: 'normal' | 'rapid' | 'distressed';
  backgroundNoise: 'low' | 'medium' | 'high';
}

export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EmergencyStatus =
  | 'DETECTED'
  | 'ANALYZING'
  | 'COUNTDOWN'
  | 'DISPATCHED'
  | 'CANCELLED'
  | 'VERIFIED'
  | 'FALSE_ALARM';

export interface EmergencyAlert {
  eventId: string;
  userId: string;
  message: string;
  gpsCoordinates: GPSCoordinates;
  audioUrl: string;
  threatLevel: ThreatLevel;
  timestamp: Date;
}

export interface CommunityValidation {
  id: string;
  eventIds: string[];
  gpsRadius: number;
  centerCoordinates: GPSCoordinates;
  consensusScore: number;
  isVerified: boolean;
  participantCount: number;
  timestamp: Date;
}

export interface AbuseRecord {
  id: string;
  userId: string;
  eventId: string;
  reason: string;
  score: number;
  isBlacklisted: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

export interface AudioStreamConfig {
  sampleRate: number;
  channels: number;
  bufferSize: number;
  encoding: 'pcm' | 'opus' | 'mp3';
}

export interface WakePhrase {
  phrase: string;
  confidence: number;
  timestamp: Date;
}

export const WAKE_PHRASES = ['help me', 'save me', 'emergency', 'stop'] as const;

export const EMERGENCY_COUNTDOWN_SECONDS = 10;

export const GPS_RADIUS_METERS = 500;

export const MAX_TRUSTED_CONTACTS = 3;

export const AUDIO_BUFFER_SECONDS = 15;

// Validator types
export * from './validator.types';

// RBAC types
export * from './rbac.types';
