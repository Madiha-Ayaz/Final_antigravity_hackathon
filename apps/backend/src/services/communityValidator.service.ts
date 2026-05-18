import { redisService } from './redis.service';
import { logger } from '@silentsiren/logger';
import {
  EmergencyIncident,
  ValidationResult,
  CommunityValidatorConfig,
} from '@silentsiren/shared-types';

const DEFAULT_CONFIG: CommunityValidatorConfig = {
  radiusMeters: 500, // 500 meters
  timeWindowSeconds: 300, // 5 minutes
  minIncidentsForConsensus: 2, // At least 2 incidents
  minAverageConfidence: 0.7, // 70% average confidence
  maxIncidentsPerUser: 3, // Max 3 incidents per hour
  cooldownSeconds: 3600, // 1 hour cooldown
};

class CommunityValidatorService {
  private config: CommunityValidatorConfig;
  private readonly INCIDENTS_GEO_KEY = 'incidents:geo';
  private readonly INCIDENTS_DATA_KEY = 'incidents:data';
  private readonly INCIDENTS_TIME_KEY = 'incidents:time';

  constructor(config: Partial<CommunityValidatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Submit a new emergency incident for validation
   */
  async submitIncident(incident: EmergencyIncident): Promise<ValidationResult> {
    try {
      const { id, location, timestamp, aiAnalysis } = incident;

      // Store incident in Redis with geospatial indexing
      await this.storeIncident(incident);

      // Find nearby incidents within radius and time window
      const nearbyIncidents = await this.findNearbyIncidents(
        location.latitude,
        location.longitude,
        timestamp
      );

      // Filter out the current incident
      const otherIncidents = nearbyIncidents.filter((inc) => inc.id !== id);

      // Calculate validation score
      const validationResult = await this.calculateValidation(incident, otherIncidents);

      // Update incident status based on validation
      if (validationResult.consensusReached) {
        await this.updateIncidentStatus(id, 'validated', validationResult.validationScore);
      }

      logger.info('Incident validation completed', {
        incidentId: id,
        nearbyCount: otherIncidents.length,
        validationScore: validationResult.validationScore,
        consensusReached: validationResult.consensusReached,
      });

      return validationResult;
    } catch (error) {
      logger.error('Failed to submit incident for validation:', error);
      throw error;
    }
  }

  /**
   * Store incident in Redis with geospatial and temporal indexing
   */
  private async storeIncident(incident: EmergencyIncident): Promise<void> {
    const { id, location, timestamp } = incident;

    // Store geospatial data
    await redisService.geoAdd(this.INCIDENTS_GEO_KEY, location.longitude, location.latitude, id);

    // Store incident data as hash
    await redisService.hSet(`${this.INCIDENTS_DATA_KEY}:${id}`, 'data', JSON.stringify(incident));

    // Store timestamp in sorted set for time-based queries
    const timestampScore = new Date(timestamp).getTime();
    await redisService.zAdd(this.INCIDENTS_TIME_KEY, timestampScore, id);

    // Set expiry for incident data (24 hours)
    await redisService.expire(`${this.INCIDENTS_DATA_KEY}:${id}`, 86400);

    // Clean up old incidents (older than 24 hours)
    const oneDayAgo = Date.now() - 86400000;
    await redisService.zRemRangeByScore(this.INCIDENTS_TIME_KEY, 0, oneDayAgo);
  }

  /**
   * Find nearby incidents within radius and time window
   */
  private async findNearbyIncidents(
    latitude: number,
    longitude: number,
    timestamp: Date
  ): Promise<EmergencyIncident[]> {
    // Find incidents within radius
    const nearbyIds = await redisService.geoRadius(
      this.INCIDENTS_GEO_KEY,
      longitude,
      latitude,
      this.config.radiusMeters,
      'm'
    );

    // Filter by time window
    const timeWindowStart = new Date(timestamp).getTime() - this.config.timeWindowSeconds * 1000;
    const timeWindowEnd = new Date(timestamp).getTime() + this.config.timeWindowSeconds * 1000;

    const incidents: EmergencyIncident[] = [];

    for (const id of nearbyIds) {
      const dataStr = await redisService.hGet(`${this.INCIDENTS_DATA_KEY}:${id}`, 'data');
      if (dataStr) {
        const incident: EmergencyIncident = JSON.parse(dataStr);
        const incidentTime = new Date(incident.timestamp).getTime();

        // Check if within time window
        if (incidentTime >= timeWindowStart && incidentTime <= timeWindowEnd) {
          incidents.push(incident);
        }
      }
    }

    return incidents;
  }

  /**
   * Calculate validation score and consensus
   */
  private async calculateValidation(
    currentIncident: EmergencyIncident,
    nearbyIncidents: EmergencyIncident[]
  ): Promise<ValidationResult> {
    const nearbyCount = nearbyIncidents.length;

    // No nearby incidents - cannot validate
    if (nearbyCount === 0) {
      return {
        isValidated: false,
        validationScore: 0,
        nearbyIncidentCount: 0,
        consensusReached: false,
        reasoning: 'No nearby incidents found for cross-validation',
        shouldDispatch: currentIncident.aiAnalysis.confidence >= 0.85, // High confidence threshold
        nearbyIncidents: [],
      };
    }

    // Calculate similarity scores
    const nearbyWithScores = nearbyIncidents.map((incident) => {
      const distance = this.calculateDistance(
        currentIncident.location.latitude,
        currentIncident.location.longitude,
        incident.location.latitude,
        incident.location.longitude
      );

      const timeDiff = Math.abs(
        new Date(currentIncident.timestamp).getTime() - new Date(incident.timestamp).getTime()
      );

      return {
        id: incident.id,
        distance,
        timeDiff: timeDiff / 1000, // Convert to seconds
        confidence: incident.aiAnalysis.confidence,
        threatLevel: incident.aiAnalysis.threatLevel,
        audioPatterns: incident.aiAnalysis.audioPatterns || [],
      };
    });

    // Calculate average confidence
    const allConfidences = [
      currentIncident.aiAnalysis.confidence,
      ...nearbyWithScores.map((inc) => inc.confidence),
    ];
    const avgConfidence = allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length;

    // Check for consensus
    const consensusReached =
      nearbyCount >= this.config.minIncidentsForConsensus - 1 &&
      avgConfidence >= this.config.minAverageConfidence;

    // Calculate validation score (0-1)
    let validationScore = 0;

    // Factor 1: Number of nearby incidents (max 0.4)
    const incidentFactor = Math.min(nearbyCount / 5, 1) * 0.4;

    // Factor 2: Average confidence (max 0.3)
    const confidenceFactor = avgConfidence * 0.3;

    // Factor 3: Proximity in time (max 0.2)
    const avgTimeDiff = nearbyWithScores.reduce((sum, inc) => sum + inc.timeDiff, 0) / nearbyCount;
    const timeFactor = Math.max(0, 1 - avgTimeDiff / this.config.timeWindowSeconds) * 0.2;

    // Factor 4: Proximity in space (max 0.1)
    const avgDistance = nearbyWithScores.reduce((sum, inc) => sum + inc.distance, 0) / nearbyCount;
    const distanceFactor = Math.max(0, 1 - avgDistance / this.config.radiusMeters) * 0.1;

    validationScore = incidentFactor + confidenceFactor + timeFactor + distanceFactor;

    // Determine if should dispatch
    const shouldDispatch = consensusReached && validationScore >= 0.7;

    let reasoning = '';
    if (consensusReached) {
      reasoning = `Consensus reached with ${nearbyCount} nearby incident(s). Average confidence: ${(avgConfidence * 100).toFixed(1)}%. Validation score: ${(validationScore * 100).toFixed(1)}%.`;
    } else if (nearbyCount < this.config.minIncidentsForConsensus - 1) {
      reasoning = `Insufficient nearby incidents (${nearbyCount}/${this.config.minIncidentsForConsensus - 1} required).`;
    } else {
      reasoning = `Average confidence too low (${(avgConfidence * 100).toFixed(1)}% < ${this.config.minAverageConfidence * 100}%).`;
    }

    return {
      isValidated: consensusReached,
      validationScore,
      nearbyIncidentCount: nearbyCount,
      consensusReached,
      reasoning,
      shouldDispatch,
      nearbyIncidents: nearbyWithScores,
    };
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Update incident status
   */
  private async updateIncidentStatus(
    incidentId: string,
    status: EmergencyIncident['status'],
    validationScore?: number
  ): Promise<void> {
    const dataStr = await redisService.hGet(`${this.INCIDENTS_DATA_KEY}:${incidentId}`, 'data');
    if (dataStr) {
      const incident: EmergencyIncident = JSON.parse(dataStr);
      incident.status = status;
      if (validationScore !== undefined) {
        incident.validationScore = validationScore;
      }
      await redisService.hSet(
        `${this.INCIDENTS_DATA_KEY}:${incidentId}`,
        'data',
        JSON.stringify(incident)
      );
    }
  }

  /**
   * Get incident by ID
   */
  async getIncident(incidentId: string): Promise<EmergencyIncident | null> {
    const dataStr = await redisService.hGet(`${this.INCIDENTS_DATA_KEY}:${incidentId}`, 'data');
    if (!dataStr) {
      return null;
    }
    return JSON.parse(dataStr);
  }

  /**
   * Get validation status for an incident
   */
  async getValidationStatus(incidentId: string): Promise<ValidationResult | null> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      return null;
    }

    const nearbyIncidents = await this.findNearbyIncidents(
      incident.location.latitude,
      incident.location.longitude,
      incident.timestamp
    );

    const otherIncidents = nearbyIncidents.filter((inc) => inc.id !== incidentId);

    return await this.calculateValidation(incident, otherIncidents);
  }
}

export const communityValidatorService = new CommunityValidatorService();
