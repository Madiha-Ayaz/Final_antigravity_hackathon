/**
 * Antigravity Trace System
 * Complete emergency detection and response tracing
 */

export { antigravityTraceLogger } from './traceLogger';
export { antigravityTrace } from './antigravityTrace';
export { confidenceScorer } from './confidenceScorer';
export { emergencyClassifier } from './emergencyClassifier';
export { alertRetryManager } from './alertRetry';
export { EventPipeline, createEmergencyPipeline, executeEmergencyPipeline } from './eventPipeline';
export { AUDIO_ANALYSIS_PROMPT } from './prompts';

export type {
  TraceEvent,
  TraceSession,
  DecisionNode,
  ActionRecord,
  TraceSummary,
} from './traceLogger';

export type {
  EmergencyContext,
  AIAnalysisResult,
  SignalFusionResult,
  AlertExecutionResult,
  EmergencyType,
} from './antigravityTrace';

export type { ConfidenceFactor, ConfidenceScore } from './confidenceScorer';

export type { PipelineStage, PipelineResult } from './eventPipeline';
