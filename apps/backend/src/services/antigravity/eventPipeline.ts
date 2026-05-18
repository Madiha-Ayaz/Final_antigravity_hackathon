import { antigravityTrace, EmergencyContext, AIAnalysisResult, SignalFusionResult } from './antigravityTrace';
import { emergencyClassifier } from './emergencyClassifier';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('event-pipeline');

export interface PipelineStage {
  name: string;
  execute: (context: any) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

export interface PipelineResult {
  success: boolean;
  stages: Array<{
    name: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    duration: number;
    result?: any;
    error?: string;
  }>;
  finalResult?: any;
  totalDuration: number;
}

/**
 * Event Pipeline for processing emergency events through multiple stages
 */
class EventPipeline {
  private stages: PipelineStage[] = [];
  private traceId?: string;

  constructor(traceId?: string) {
    this.traceId = traceId;
  }

  /**
   * Add a stage to the pipeline
   */
  addStage(stage: PipelineStage): this {
    this.stages.push(stage);
    return this;
  }

  /**
   * Execute the pipeline
   */
  async execute(initialContext: any): Promise<PipelineResult> {
    const startTime = Date.now();
    const result: PipelineResult = {
      success: true,
      stages: [],
      totalDuration: 0,
    };

    let context = initialContext;

    for (const stage of this.stages) {
      const stageStartTime = Date.now();

      try {
        logger.info(`Executing pipeline stage: ${stage.name}`, {
          traceId: this.traceId,
        });

        // Execute stage with timeout
        const stageResult = await this.executeWithTimeout(
          stage.execute(context),
          stage.timeout || 30000
        );

        const stageDuration = Date.now() - stageStartTime;

        result.stages.push({
          name: stage.name,
          status: 'SUCCESS',
          duration: stageDuration,
          result: stageResult,
        });

        // Update context for next stage
        context = { ...context, [stage.name]: stageResult };

        // Call success callback
        if (stage.onSuccess) {
          stage.onSuccess(stageResult);
        }

        logger.info(`Pipeline stage completed: ${stage.name}`, {
          traceId: this.traceId,
          duration: stageDuration,
        });
      } catch (error) {
        const stageDuration = Date.now() - stageStartTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        result.stages.push({
          name: stage.name,
          status: 'FAILED',
          duration: stageDuration,
          error: errorMessage,
        });

        result.success = false;

        // Call error callback
        if (stage.onError) {
          stage.onError(error as Error);
        }

        logger.error(`Pipeline stage failed: ${stage.name}`, {
          traceId: this.traceId,
          error: errorMessage,
          duration: stageDuration,
        });

        // Stop pipeline on error
        break;
      }
    }

    result.totalDuration = Date.now() - startTime;
    result.finalResult = context;

    logger.info('Pipeline execution completed', {
      traceId: this.traceId,
      success: result.success,
      totalDuration: result.totalDuration,
      stagesCompleted: result.stages.filter((s) => s.status === 'SUCCESS').length,
      stagesFailed: result.stages.filter((s) => s.status === 'FAILED').length,
    });

    return result;
  }

  /**
   * Execute promise with timeout
   */
  private executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Stage timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }
}

/**
 * Create standard emergency detection pipeline
 */
export function createEmergencyPipeline(context: EmergencyContext): EventPipeline {
  const traceId = antigravityTrace.startEmergencyTrace(context);
  const pipeline = new EventPipeline(traceId);

  // Stage 1: Initial Detection
  pipeline.addStage({
    name: 'initial_detection',
    execute: async (ctx) => {
      antigravityTrace.logEmergencyResponse(
        traceId,
        'DETECTION',
        'STARTED',
        { eventType: context.eventType }
      );

      return {
        traceId,
        detected: true,
        timestamp: new Date(),
        eventType: context.eventType,
      };
    },
    onSuccess: () => {
      antigravityTrace.logEmergencyResponse(
        traceId,
        'DETECTION',
        'COMPLETED',
        { detected: true }
      );
    },
  });

  // Stage 2: AI Analysis
  pipeline.addStage({
    name: 'ai_analysis',
    execute: async (ctx) => {
      antigravityTrace.logEmergencyResponse(
        traceId,
        'ANALYSIS',
        'STARTED',
        { hasTranscript: !!context.transcript }
      );

      // Classify emergency type
      const classification = emergencyClassifier.classifyEmergency(
        context.transcript || '',
        ['distress_keywords', 'elevated_voice', 'panic_tone'],
        0.78
      );

      // Simulate AI analysis (replace with actual AI call)
      const analysisResult: AIAnalysisResult = {
        isCrisis: true,
        confidence: 0.85,
        threatLevel: 'HIGH',
        emergencyType: classification.emergencyType,
        reasoning: `${classification.reasoning}. Detected distress signals in voice pattern and keywords`,
        detectedPatterns: ['distress_keywords', 'elevated_voice', 'panic_tone'],
        emotionalStress: 0.78,
        recommendedActions: ['alert_contacts', 'notify_authorities', 'track_location'],
      };

      await antigravityTrace.logAIAnalysis(
        traceId,
        context.transcript || 'No transcript available',
        'gemini-1.5-flash',
        analysisResult
      );

      return analysisResult;
    },
    onSuccess: () => {
      antigravityTrace.logEmergencyResponse(
        traceId,
        'ANALYSIS',
        'COMPLETED',
        { aiAnalysisComplete: true }
      );
    },
    timeout: 10000,
  });

  // Stage 3: Signal Fusion
  pipeline.addStage({
    name: 'signal_fusion',
    execute: async (ctx) => {
      const aiAnalysis = ctx.ai_analysis as AIAnalysisResult;

      const fusionResult: SignalFusionResult = {
        signals: [
          {
            source: 'ai_analysis',
            value: aiAnalysis.confidence,
            weight: 0.6,
            confidence: aiAnalysis.confidence,
          },
          {
            source: 'user_trigger',
            value: 1.0,
            weight: 0.3,
            confidence: 1.0,
          },
          {
            source: 'location_accuracy',
            value: context.location ? 0.9 : 0.5,
            weight: 0.1,
            confidence: context.location?.accuracy ? 1 - (context.location.accuracy / 100) : 0.5,
          },
        ],
        fusedConfidence: 0.87,
        fusedThreatLevel: aiAnalysis.threatLevel,
        reasoning: 'Combined AI analysis, user trigger, and location data',
      };

      antigravityTrace.logSignalFusion(traceId, fusionResult);

      return fusionResult;
    },
  });

  // Stage 4: Classification
  pipeline.addStage({
    name: 'classification',
    execute: async (ctx) => {
      antigravityTrace.logEmergencyResponse(
        traceId,
        'CLASSIFICATION',
        'STARTED',
        {}
      );

      const fusion = ctx.signal_fusion as SignalFusionResult;

      const classification = {
        type: 'EMERGENCY',
        threatLevel: fusion.fusedThreatLevel,
        confidence: fusion.fusedConfidence,
        requiresDispatch: fusion.fusedThreatLevel === 'HIGH' || fusion.fusedThreatLevel === 'CRITICAL',
      };

      antigravityTrace.logEmergencyResponse(
        traceId,
        'CLASSIFICATION',
        'COMPLETED',
        classification
      );

      return classification;
    },
  });

  // Stage 5: Alert Execution
  pipeline.addStage({
    name: 'alert_execution',
    execute: async (ctx) => {
      antigravityTrace.logEmergencyResponse(
        traceId,
        'ALERT',
        'STARTED',
        {}
      );

      const classification = ctx.classification;
      const alerts: any[] = [];

      // Execute alerts based on threat level
      if (classification.requiresDispatch) {
        // SMS Alert
        const smsResult = await antigravityTrace.logAlertExecution(
          traceId,
          'SMS',
          ['+923343717260'],
          async () => ({ sent: true, messageId: 'sms_123' })
        );
        alerts.push(smsResult);

        // Voice Call Alert
        const voiceResult = await antigravityTrace.logAlertExecution(
          traceId,
          'VOICE_CALL',
          ['+923343717260'],
          async () => ({ called: true, callId: 'call_123' })
        );
        alerts.push(voiceResult);

        // WhatsApp Alert
        const whatsappResult = await antigravityTrace.logAlertExecution(
          traceId,
          'WHATSAPP',
          ['+923343717260'],
          async () => ({ sent: true, messageId: 'wa_123' })
        );
        alerts.push(whatsappResult);
      }

      antigravityTrace.logEmergencyResponse(
        traceId,
        'ALERT',
        'COMPLETED',
        { alertsSent: alerts.length }
      );

      return { alerts, totalSent: alerts.length };
    },
    timeout: 15000,
  });

  // Stage 6: Dispatch (if needed)
  pipeline.addStage({
    name: 'dispatch',
    execute: async (ctx) => {
      const classification = ctx.classification;

      if (classification.requiresDispatch) {
        antigravityTrace.logEmergencyResponse(
          traceId,
          'DISPATCH',
          'STARTED',
          {}
        );

        // Simulate dispatch
        const dispatchResult = {
          dispatched: true,
          dispatchId: 'dispatch_123',
          estimatedArrival: '5-10 minutes',
        };

        antigravityTrace.logEmergencyResponse(
          traceId,
          'DISPATCH',
          'COMPLETED',
          dispatchResult
        );

        return dispatchResult;
      }

      return { dispatched: false, reason: 'Not required for this threat level' };
    },
  });

  return pipeline;
}

/**
 * Execute emergency pipeline with automatic tracing
 */
export async function executeEmergencyPipeline(
  context: EmergencyContext
): Promise<{ traceId: string; result: PipelineResult }> {
  const pipeline = createEmergencyPipeline(context);
  const result = await pipeline.execute(context);

  // Get trace ID from pipeline result
  const traceId = result.finalResult?.initial_detection?.traceId;

  if (traceId) {
    // End trace session
    antigravityTrace.endEmergencyTrace(
      traceId,
      result.success ? 'Emergency Processed Successfully' : 'Emergency Processing Failed',
      result.success ? 'COMPLETED' : 'FAILED'
    );
  }

  return { traceId, result };
}

export { EventPipeline };
