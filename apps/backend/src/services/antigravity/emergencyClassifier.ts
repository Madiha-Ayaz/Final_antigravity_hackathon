import { createLogger } from '@silentsiren/logger';
import type { EmergencyType } from './antigravityTrace';

const logger = createLogger('emergency-classifier');

interface ClassificationResult {
  emergencyType: EmergencyType;
  confidence: number;
  reasoning: string;
  matchedKeywords: string[];
}

/**
 * Emergency Type Classifier
 * Analyzes transcript and patterns to determine specific emergency type
 */
class EmergencyClassifier {
  private readonly patterns = {
    ROBBERY: {
      keywords: [
        'rob',
        'steal',
        'thief',
        'burglar',
        'gun',
        'weapon',
        'money',
        'wallet',
        'purse',
        'break in',
        'breaking in',
      ],
      patterns: ['someone_breaking_in', 'theft_in_progress', 'armed_threat', 'property_crime'],
      weight: 1.0,
    },
    MEDICAL: {
      keywords: [
        'hurt',
        'pain',
        'bleeding',
        'unconscious',
        'heart attack',
        'stroke',
        'seizure',
        'breathing',
        'chest pain',
        'ambulance',
        'hospital',
        'injury',
        'fell',
        'accident',
      ],
      patterns: ['medical_distress', 'injury_detected', 'health_emergency', 'unconscious_person'],
      weight: 1.0,
    },
    ACCIDENT: {
      keywords: [
        'crash',
        'accident',
        'collision',
        'hit',
        'car accident',
        'vehicle',
        'injured',
        'trapped',
        'fire',
      ],
      patterns: ['vehicle_accident', 'collision_detected', 'impact_detected'],
      weight: 0.9,
    },
    HARASSMENT: {
      keywords: [
        'following',
        'stalking',
        'harass',
        'threatening',
        'scared',
        'uncomfortable',
        "won't leave",
        'bothering',
      ],
      patterns: [
        'stalking_behavior',
        'harassment_detected',
        'threatening_behavior',
        'unwanted_contact',
      ],
      weight: 0.8,
    },
    ASSAULT: {
      keywords: [
        'attack',
        'hitting',
        'fighting',
        'assault',
        'violence',
        'hurt me',
        'grabbed',
        'pushed',
      ],
      patterns: ['physical_violence', 'assault_in_progress', 'violent_behavior'],
      weight: 1.0,
    },
    FIRE: {
      keywords: ['fire', 'smoke', 'burning', 'flames', 'explosion', 'gas leak'],
      patterns: ['fire_detected', 'smoke_detected', 'explosion'],
      weight: 1.0,
    },
    NATURAL_DISASTER: {
      keywords: ['earthquake', 'flood', 'tornado', 'hurricane', 'landslide', 'tsunami'],
      patterns: ['natural_disaster', 'earthquake_detected', 'severe_weather'],
      weight: 1.0,
    },
    FALSE_ALARM: {
      keywords: ['mistake', 'accident', "didn't mean", 'false alarm', 'wrong button', 'sorry'],
      patterns: ['accidental_trigger', 'user_cancelled', 'false_positive'],
      weight: 0.5,
    },
  };

  /**
   * Classify emergency type from transcript and detected patterns
   */
  classifyEmergency(
    transcript: string,
    detectedPatterns: string[],
    emotionalStress?: number
  ): ClassificationResult {
    const transcriptLower = transcript.toLowerCase();
    const scores: Record<EmergencyType, { score: number; matches: string[] }> = {
      ROBBERY: { score: 0, matches: [] },
      MEDICAL: { score: 0, matches: [] },
      ACCIDENT: { score: 0, matches: [] },
      HARASSMENT: { score: 0, matches: [] },
      ASSAULT: { score: 0, matches: [] },
      FIRE: { score: 0, matches: [] },
      NATURAL_DISASTER: { score: 0, matches: [] },
      FALSE_ALARM: { score: 0, matches: [] },
      UNKNOWN: { score: 0, matches: [] },
    };

    // Score based on keywords in transcript
    for (const [type, config] of Object.entries(this.patterns)) {
      const emergencyType = type as EmergencyType;

      for (const keyword of config.keywords) {
        if (transcriptLower.includes(keyword)) {
          scores[emergencyType].score += config.weight;
          scores[emergencyType].matches.push(keyword);
        }
      }

      // Score based on detected patterns
      for (const pattern of config.patterns) {
        if (detectedPatterns.includes(pattern)) {
          scores[emergencyType].score += config.weight * 1.5; // Patterns weighted higher
          scores[emergencyType].matches.push(pattern);
        }
      }
    }

    // Boost medical if high emotional stress
    if (emotionalStress && emotionalStress > 0.7) {
      scores.MEDICAL.score += 0.3;
    }

    // Find highest scoring type
    let maxScore = 0;
    let topType: EmergencyType = 'UNKNOWN';
    let topMatches: string[] = [];

    for (const [type, data] of Object.entries(scores)) {
      if (data.score > maxScore) {
        maxScore = data.score;
        topType = type as EmergencyType;
        topMatches = data.matches;
      }
    }

    // Calculate confidence based on score
    const confidence = Math.min(maxScore / 3, 1.0); // Normalize to 0-1

    // If confidence too low, mark as UNKNOWN
    if (confidence < 0.3 && topType !== 'FALSE_ALARM') {
      topType = 'UNKNOWN';
    }

    const reasoning = this.generateReasoning(topType, topMatches, confidence);

    logger.info('Classified emergency type', {
      emergencyType: topType,
      confidence,
      matchedKeywords: topMatches.length,
    });

    return {
      emergencyType: topType,
      confidence,
      reasoning,
      matchedKeywords: topMatches,
    };
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(type: EmergencyType, matches: string[], confidence: number): string {
    if (type === 'UNKNOWN') {
      return 'Unable to determine specific emergency type from available information';
    }

    if (type === 'FALSE_ALARM') {
      return `Detected false alarm indicators: ${matches.slice(0, 3).join(', ')}`;
    }

    const matchStr =
      matches.length > 0
        ? `Detected indicators: ${matches.slice(0, 5).join(', ')}`
        : 'Based on pattern analysis';

    return `Classified as ${type} emergency (${(confidence * 100).toFixed(1)}% confidence). ${matchStr}`;
  }

  /**
   * Get recommended response for emergency type
   */
  getRecommendedResponse(type: EmergencyType): {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    channels: string[];
    dispatchRequired: boolean;
    specialInstructions: string[];
  } {
    const responses = {
      ROBBERY: {
        priority: 'CRITICAL' as const,
        channels: ['SMS', 'VOICE_CALL', 'WHATSAPP'],
        dispatchRequired: true,
        specialInstructions: [
          'Do not confront the perpetrator',
          'Find safe location if possible',
          'Note physical descriptions',
        ],
      },
      MEDICAL: {
        priority: 'CRITICAL' as const,
        channels: ['SMS', 'VOICE_CALL', 'WHATSAPP'],
        dispatchRequired: true,
        specialInstructions: [
          'Call emergency medical services immediately',
          'Do not move injured person unless necessary',
          'Provide first aid if trained',
        ],
      },
      ACCIDENT: {
        priority: 'HIGH' as const,
        channels: ['SMS', 'VOICE_CALL', 'WHATSAPP'],
        dispatchRequired: true,
        specialInstructions: [
          'Ensure scene is safe',
          'Check for injuries',
          'Document damage if possible',
        ],
      },
      HARASSMENT: {
        priority: 'HIGH' as const,
        channels: ['SMS', 'WHATSAPP'],
        dispatchRequired: false,
        specialInstructions: [
          'Move to public area if possible',
          'Document incidents',
          'Contact authorities if escalates',
        ],
      },
      ASSAULT: {
        priority: 'CRITICAL' as const,
        channels: ['SMS', 'VOICE_CALL', 'WHATSAPP'],
        dispatchRequired: true,
        specialInstructions: [
          'Prioritize personal safety',
          'Escape if possible',
          'Call police immediately',
        ],
      },
      FIRE: {
        priority: 'CRITICAL' as const,
        channels: ['SMS', 'VOICE_CALL', 'WHATSAPP'],
        dispatchRequired: true,
        specialInstructions: [
          'Evacuate immediately',
          'Do not use elevators',
          'Call fire department',
        ],
      },
      NATURAL_DISASTER: {
        priority: 'CRITICAL' as const,
        channels: ['SMS', 'VOICE_CALL', 'WHATSAPP'],
        dispatchRequired: true,
        specialInstructions: [
          'Follow emergency protocols',
          'Seek shelter immediately',
          'Monitor emergency broadcasts',
        ],
      },
      FALSE_ALARM: {
        priority: 'LOW' as const,
        channels: ['SMS'],
        dispatchRequired: false,
        specialInstructions: ['Confirm cancellation with user', 'Log incident for review'],
      },
      UNKNOWN: {
        priority: 'MEDIUM' as const,
        channels: ['SMS', 'WHATSAPP'],
        dispatchRequired: false,
        specialInstructions: ['Request additional information', 'Monitor situation'],
      },
    };

    return responses[type];
  }
}

export const emergencyClassifier = new EmergencyClassifier();
