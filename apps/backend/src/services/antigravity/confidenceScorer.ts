import { createLogger } from '@silentsiren/logger';

const logger = createLogger('confidence-scorer');

export interface ConfidenceFactor {
  name: string;
  value: number; // 0-1
  weight: number; // 0-1
  reasoning: string;
}

export interface ConfidenceScore {
  overallScore: number; // 0-1
  factors: ConfidenceFactor[];
  reasoning: string;
  reliability: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendations: string[];
}

/**
 * Confidence Scorer for emergency detection
 * Combines multiple signals to produce a confidence score
 */
class ConfidenceScorer {
  /**
   * Calculate confidence score from multiple factors
   */
  calculateScore(factors: ConfidenceFactor[]): ConfidenceScore {
    // Normalize weights
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const normalizedFactors = factors.map((f) => ({
      ...f,
      weight: f.weight / totalWeight,
    }));

    // Calculate weighted average
    const overallScore = normalizedFactors.reduce(
      (sum, f) => sum + f.value * f.weight,
      0
    );

    // Determine reliability based on number of factors and variance
    const reliability = this.determineReliability(normalizedFactors, overallScore);

    // Generate reasoning
    const reasoning = this.generateReasoning(normalizedFactors, overallScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      normalizedFactors,
      overallScore,
      reliability
    );

    logger.info('Calculated confidence score', {
      overallScore,
      reliability,
      factorCount: factors.length,
    });

    return {
      overallScore,
      factors: normalizedFactors,
      reasoning,
      reliability,
      recommendations,
    };
  }

  /**
   * Score AI analysis confidence
   */
  scoreAIAnalysis(
    aiConfidence: number,
    detectedPatterns: string[],
    emotionalStress?: number,
    transcriptLength?: number
  ): ConfidenceScore {
    const factors: ConfidenceFactor[] = [
      {
        name: 'ai_model_confidence',
        value: aiConfidence,
        weight: 0.4,
        reasoning: `AI model reported ${(aiConfidence * 100).toFixed(1)}% confidence`,
      },
      {
        name: 'pattern_detection',
        value: Math.min(detectedPatterns.length / 5, 1.0),
        weight: 0.3,
        reasoning: `Detected ${detectedPatterns.length} distress patterns`,
      },
    ];

    if (emotionalStress !== undefined) {
      factors.push({
        name: 'emotional_stress',
        value: emotionalStress,
        weight: 0.2,
        reasoning: `Emotional stress level: ${(emotionalStress * 100).toFixed(1)}%`,
      });
    }

    if (transcriptLength !== undefined) {
      const lengthScore = Math.min(transcriptLength / 100, 1.0);
      factors.push({
        name: 'transcript_quality',
        value: lengthScore,
        weight: 0.1,
        reasoning: `Transcript length: ${transcriptLength} characters`,
      });
    }

    return this.calculateScore(factors);
  }

  /**
   * Score signal fusion confidence
   */
  scoreSignalFusion(
    signals: Array<{ source: string; confidence: number; weight: number }>
  ): ConfidenceScore {
    const factors: ConfidenceFactor[] = signals.map((signal) => ({
      name: signal.source,
      value: signal.confidence,
      weight: signal.weight,
      reasoning: `${signal.source} confidence: ${(signal.confidence * 100).toFixed(1)}%`,
    }));

    return this.calculateScore(factors);
  }

  /**
   * Score location accuracy
   */
  scoreLocationAccuracy(
    accuracy: number,
    hasAddress: boolean,
    timestamp: Date
  ): ConfidenceScore {
    const ageMinutes = (Date.now() - timestamp.getTime()) / 1000 / 60;
    const freshnessScore = Math.max(0, 1 - ageMinutes / 10); // Decay over 10 minutes

    const factors: ConfidenceFactor[] = [
      {
        name: 'gps_accuracy',
        value: Math.max(0, 1 - accuracy / 100), // Lower accuracy meters = higher score
        weight: 0.5,
        reasoning: `GPS accuracy: ${accuracy.toFixed(1)} meters`,
      },
      {
        name: 'address_available',
        value: hasAddress ? 1.0 : 0.5,
        weight: 0.3,
        reasoning: hasAddress ? 'Address resolved' : 'No address available',
      },
      {
        name: 'location_freshness',
        value: freshnessScore,
        weight: 0.2,
        reasoning: `Location age: ${ageMinutes.toFixed(1)} minutes`,
      },
    ];

    return this.calculateScore(factors);
  }

  /**
   * Score user trigger reliability
   */
  scoreUserTrigger(
    triggerType: 'VOICE_TRIGGER' | 'MANUAL' | 'PANIC_BUTTON',
    userReputationScore: number,
    previousFalseAlarms: number
  ): ConfidenceScore {
    // Different trigger types have different base reliability
    const triggerReliability: Record<string, number> = {
      PANIC_BUTTON: 0.95,
      MANUAL: 0.85,
      VOICE_TRIGGER: 0.75,
    };

    // Reputation score (0-100) normalized to 0-1
    const reputationFactor = userReputationScore / 100;

    // False alarm penalty
    const falseAlarmPenalty = Math.max(0, 1 - previousFalseAlarms * 0.1);

    const factors: ConfidenceFactor[] = [
      {
        name: 'trigger_type',
        value: triggerReliability[triggerType],
        weight: 0.5,
        reasoning: `Trigger type: ${triggerType}`,
      },
      {
        name: 'user_reputation',
        value: reputationFactor,
        weight: 0.3,
        reasoning: `User reputation score: ${userReputationScore}/100`,
      },
      {
        name: 'false_alarm_history',
        value: falseAlarmPenalty,
        weight: 0.2,
        reasoning: `Previous false alarms: ${previousFalseAlarms}`,
      },
    ];

    return this.calculateScore(factors);
  }

  /**
   * Score community validation
   */
  scoreCommunityValidation(
    confirmations: number,
    denials: number,
    uncertains: number,
    averageDistance: number
  ): ConfidenceScore {
    const total = confirmations + denials + uncertains;
    if (total === 0) {
      return {
        overallScore: 0.5,
        factors: [],
        reasoning: 'No community validation available',
        reliability: 'LOW',
        recommendations: ['Wait for community validation'],
      };
    }

    const confirmationRatio = confirmations / total;
    const denialRatio = denials / total;
    const proximityScore = Math.max(0, 1 - averageDistance / 1000); // Decay over 1km

    const factors: ConfidenceFactor[] = [
      {
        name: 'confirmation_ratio',
        value: confirmationRatio,
        weight: 0.5,
        reasoning: `${confirmations}/${total} confirmations`,
      },
      {
        name: 'denial_impact',
        value: 1 - denialRatio,
        weight: 0.3,
        reasoning: `${denials}/${total} denials`,
      },
      {
        name: 'validator_proximity',
        value: proximityScore,
        weight: 0.2,
        reasoning: `Average distance: ${averageDistance.toFixed(0)}m`,
      },
    ];

    return this.calculateScore(factors);
  }

  /**
   * Determine reliability level
   */
  private determineReliability(
    factors: ConfidenceFactor[],
    overallScore: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    // Calculate variance to measure consistency
    const variance =
      factors.reduce((sum, f) => sum + Math.pow(f.value - overallScore, 2), 0) /
      factors.length;

    const standardDeviation = Math.sqrt(variance);

    // More factors and lower variance = higher reliability
    if (factors.length >= 4 && standardDeviation < 0.15 && overallScore > 0.8) {
      return 'VERY_HIGH';
    } else if (factors.length >= 3 && standardDeviation < 0.25 && overallScore > 0.6) {
      return 'HIGH';
    } else if (factors.length >= 2 && standardDeviation < 0.35) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Generate reasoning text
   */
  private generateReasoning(
    factors: ConfidenceFactor[],
    overallScore: number
  ): string {
    const topFactors = factors
      .sort((a, b) => b.value * b.weight - a.value * a.weight)
      .slice(0, 3);

    const reasoningParts = [
      `Overall confidence: ${(overallScore * 100).toFixed(1)}%`,
      `Based on ${factors.length} factors:`,
      ...topFactors.map((f) => `- ${f.reasoning}`),
    ];

    return reasoningParts.join('\n');
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    factors: ConfidenceFactor[],
    overallScore: number,
    reliability: string
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore > 0.8 && reliability === 'VERY_HIGH') {
      recommendations.push('High confidence - proceed with emergency response');
      recommendations.push('Alert all emergency contacts immediately');
    } else if (overallScore > 0.6 && reliability === 'HIGH') {
      recommendations.push('Good confidence - proceed with caution');
      recommendations.push('Alert primary contacts and monitor situation');
    } else if (overallScore > 0.4) {
      recommendations.push('Moderate confidence - request additional validation');
      recommendations.push('Notify nearby users for community validation');
    } else {
      recommendations.push('Low confidence - gather more information');
      recommendations.push('Request user confirmation before escalating');
    }

    // Check for weak factors
    const weakFactors = factors.filter((f) => f.value < 0.5);
    if (weakFactors.length > 0) {
      recommendations.push(
        `Improve: ${weakFactors.map((f) => f.name).join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Combine multiple confidence scores
   */
  combineScores(scores: ConfidenceScore[]): ConfidenceScore {
    if (scores.length === 0) {
      throw new Error('Cannot combine empty scores array');
    }

    if (scores.length === 1) {
      return scores[0];
    }

    // Combine all factors from all scores
    const allFactors: ConfidenceFactor[] = [];
    scores.forEach((score) => {
      allFactors.push(...score.factors);
    });

    return this.calculateScore(allFactors);
  }

  /**
   * Get threat level from confidence score
   */
  getThreatLevel(
    confidenceScore: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (confidenceScore >= 0.9) return 'CRITICAL';
    if (confidenceScore >= 0.7) return 'HIGH';
    if (confidenceScore >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Should dispatch emergency services?
   */
  shouldDispatch(score: ConfidenceScore): boolean {
    return (
      score.overallScore >= 0.7 &&
      (score.reliability === 'HIGH' || score.reliability === 'VERY_HIGH')
    );
  }
}

export const confidenceScorer = new ConfidenceScorer();
