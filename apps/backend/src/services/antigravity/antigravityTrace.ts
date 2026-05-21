import { antigravityTraceLogger } from './traceLogger';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('antigravity-trace');

export interface EmergencyContext {
  userId: string;
  sessionId?: string;
  eventType: 'VOICE_TRIGGER' | 'MANUAL' | 'PANIC_BUTTON';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  audioUrl?: string;
  transcript?: string;
}

export type EmergencyType =
  | 'ROBBERY'
  | 'MEDICAL'
  | 'ACCIDENT'
  | 'HARASSMENT'
  | 'ASSAULT'
  | 'FIRE'
  | 'NATURAL_DISASTER'
  | 'FALSE_ALARM'
  | 'UNKNOWN';

export interface AIAnalysisResult {
  isCrisis: boolean;
  confidence: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  emergencyType: EmergencyType;
  reasoning: string;
  detectedPatterns: string[];
  emotionalStress?: number;
  recommendedActions: string[];
}

export interface SignalFusionResult {
  signals: Array<{
    source: string;
    value: any;
    weight: number;
    confidence: number;
  }>;
  fusedConfidence: number;
  fusedThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
}

export interface AlertExecutionResult {
  alertType: string;
  recipients: string[];
  status: 'SUCCESS' | 'FAILED';
  details: any;
  timestamp: Date;
}

/**
 * Main Antigravity Trace orchestrator
 * Manages the complete emergency detection and response flow
 */
class AntigravityTrace {
  /**
   * Start emergency trace session
   */
  startEmergencyTrace(context: EmergencyContext): string {
    const traceId = antigravityTraceLogger.startSession({
      userId: context.userId,
      sessionId: context.sessionId,
    });

    logger.info('Started emergency trace', {
      traceId,
      userId: context.userId,
      eventType: context.eventType,
    });

    // Log initial context
    if (context.location) {
      antigravityTraceLogger.logGPSEvent(
        traceId,
        context.location.latitude,
        context.location.longitude,
        context.location.accuracy,
        context.location.address
      );
    }

    // Add initial decision node
    antigravityTraceLogger.addDecisionNode(
      traceId,
      'Emergency Detection Initiated',
      `User triggered emergency via ${context.eventType}`,
      1.0,
      { context },
      { traceId }
    );

    return traceId;
  }

  /**
   * Log AI analysis of emergency
   */
  async logAIAnalysis(
    traceId: string,
    prompt: string,
    model: string,
    result: AIAnalysisResult
  ): Promise<void> {
    // Log prompt
    const promptId = antigravityTraceLogger.logAIPrompt(traceId, prompt, model, {
      purpose: 'emergency_analysis',
      expectedOutput: 'crisis_detection',
    });

    // Log response
    antigravityTraceLogger.logAIResponse(
      traceId,
      promptId,
      JSON.stringify(result),
      result.confidence,
      {
        isCrisis: result.isCrisis,
        threatLevel: result.threatLevel,
      }
    );

    // Log crisis detection
    antigravityTraceLogger.logCrisisDetection(
      traceId,
      result.isCrisis,
      result.confidence,
      result.detectedPatterns,
      result.reasoning
    );

    // Log confidence score
    antigravityTraceLogger.logConfidenceScore(
      traceId,
      result.confidence,
      {
        aiConfidence: result.confidence,
        emotionalStress: result.emotionalStress || 0,
        patternCount: result.detectedPatterns.length,
      },
      result.reasoning
    );

    // Log emergency classification
    antigravityTraceLogger.logEmergencyClassification(
      traceId,
      result.isCrisis ? 'EMERGENCY' : 'NON_EMERGENCY',
      result.threatLevel,
      result.reasoning
    );

    // Add decision node
    antigravityTraceLogger.addDecisionNode(
      traceId,
      result.isCrisis ? 'Crisis Detected' : 'No Crisis Detected',
      result.reasoning,
      result.confidence,
      { prompt, model },
      { result }
    );

    logger.info('Logged AI analysis', {
      traceId,
      isCrisis: result.isCrisis,
      confidence: result.confidence,
      threatLevel: result.threatLevel,
    });
  }

  /**
   * Log signal fusion from multiple sources
   */
  logSignalFusion(traceId: string, fusionResult: SignalFusionResult): void {
    antigravityTraceLogger.logSignalFusion(
      traceId,
      fusionResult.signals,
      {
        fusedConfidence: fusionResult.fusedConfidence,
        fusedThreatLevel: fusionResult.fusedThreatLevel,
      },
      fusionResult.fusedConfidence
    );

    // Add decision node
    antigravityTraceLogger.addDecisionNode(
      traceId,
      'Signal Fusion Complete',
      fusionResult.reasoning,
      fusionResult.fusedConfidence,
      { signals: fusionResult.signals },
      {
        fusedConfidence: fusionResult.fusedConfidence,
        fusedThreatLevel: fusionResult.fusedThreatLevel,
      }
    );

    logger.info('Logged signal fusion', {
      traceId,
      signalCount: fusionResult.signals.length,
      fusedConfidence: fusionResult.fusedConfidence,
    });
  }

  /**
   * Log fallback action when primary action fails
   */
  logFallback(
    traceId: string,
    originalAction: string,
    fallbackAction: string,
    reason: string
  ): void {
    antigravityTraceLogger.logFallbackAction(traceId, originalAction, fallbackAction, reason);

    // Add decision node
    antigravityTraceLogger.addDecisionNode(
      traceId,
      'Fallback Action Triggered',
      `Original action "${originalAction}" failed: ${reason}. Executing fallback: "${fallbackAction}"`,
      0.8,
      { originalAction, reason },
      { fallbackAction }
    );

    logger.warn('Logged fallback action', {
      traceId,
      originalAction,
      fallbackAction,
      reason,
    });
  }

  /**
   * Log alert execution
   */
  async logAlertExecution(
    traceId: string,
    alertType: string,
    recipients: string[],
    executeAlert: () => Promise<any>
  ): Promise<AlertExecutionResult> {
    const actionId = antigravityTraceLogger.addAction(
      traceId,
      `Send ${alertType} alert`,
      'PENDING'
    );

    antigravityTraceLogger.updateAction(traceId, actionId, 'IN_PROGRESS');

    try {
      const result = await executeAlert();

      antigravityTraceLogger.updateAction(traceId, actionId, 'COMPLETED', result);

      antigravityTraceLogger.logAlertExecution(traceId, alertType, recipients, 'SUCCESS', result);

      logger.info('Alert executed successfully', {
        traceId,
        alertType,
        recipients: recipients.length,
      });

      return {
        alertType,
        recipients,
        status: 'SUCCESS',
        details: result,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      antigravityTraceLogger.updateAction(traceId, actionId, 'FAILED', undefined, errorMessage);

      antigravityTraceLogger.logAlertExecution(traceId, alertType, recipients, 'FAILED', {
        error: errorMessage,
      });

      logger.error('Alert execution failed', {
        traceId,
        alertType,
        error: errorMessage,
      });

      return {
        alertType,
        recipients,
        status: 'FAILED',
        details: { error: errorMessage },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Log emergency response timeline
   */
  logEmergencyResponse(
    traceId: string,
    phase: 'DETECTION' | 'ANALYSIS' | 'CLASSIFICATION' | 'ALERT' | 'DISPATCH' | 'RESOLUTION',
    status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    details: any
  ): void {
    antigravityTraceLogger.logEvent(traceId, {
      eventType: 'EMERGENCY_RESPONSE',
      severity: status === 'FAILED' ? 'HIGH' : 'MEDIUM',
      data: {
        phase,
        status,
        details,
      },
    });

    logger.info('Logged emergency response phase', {
      traceId,
      phase,
      status,
    });
  }

  /**
   * Complete emergency trace session
   */
  endEmergencyTrace(traceId: string, finalDecision: string, outcome: string): void {
    // Add final decision node
    antigravityTraceLogger.addDecisionNode(
      traceId,
      finalDecision,
      `Emergency trace completed with outcome: ${outcome}`,
      1.0,
      {},
      { outcome }
    );

    // End session
    antigravityTraceLogger.endSession(traceId);

    logger.info('Ended emergency trace', {
      traceId,
      finalDecision,
      outcome,
    });
  }

  /**
   * Get active trace session
   */
  getTrace(traceId: string) {
    return antigravityTraceLogger.getSession(traceId);
  }

  /**
   * Get all active traces
   */
  getAllActiveTraces() {
    return antigravityTraceLogger.getActiveSessions();
  }
}

export const antigravityTrace = new AntigravityTrace();
