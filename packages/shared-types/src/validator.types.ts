export interface EmergencyIncident {
  id: string;
  userId: string;
  deviceId: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  aiAnalysis: {
    confidence: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reasoning: string;
    audioPatterns?: string[];
  };
  audioClipUrl?: string;
  status: 'pending' | 'validated' | 'rejected' | 'dispatched';
  validationScore?: number;
  nearbyIncidents?: string[];
}

export interface ValidationResult {
  isValidated: boolean;
  validationScore: number;
  nearbyIncidentCount: number;
  consensusReached: boolean;
  reasoning: string;
  shouldDispatch: boolean;
  nearbyIncidents: Array<{
    id: string;
    distance: number;
    timeDiff: number;
    confidence: number;
  }>;
}

export interface CommunityValidatorConfig {
  radiusMeters: number;
  timeWindowSeconds: number;
  minIncidentsForConsensus: number;
  minAverageConfidence: number;
  maxIncidentsPerUser: number;
  cooldownSeconds: number;
}

export interface UserReputation {
  userId: string;
  score: number;
  totalIncidents: number;
  validatedIncidents: number;
  falseAlarms: number;
  lastIncidentTime?: Date;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: Date;
}

export interface DeviceFingerprint {
  deviceId: string;
  userAgent: string;
  platform: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  firstSeen: Date;
  lastSeen: Date;
  incidentCount: number;
  isSuspicious: boolean;
}
