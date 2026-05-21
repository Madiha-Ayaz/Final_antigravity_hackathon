import { createLogger } from '@silentsiren/logger';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';

const logger = createLogger('antigravity-trace');

export interface TraceEvent {
  eventId: string;
  traceId: string;
  timestamp: Date;
  eventType:
    | 'AI_PROMPT'
    | 'AI_RESPONSE'
    | 'CRISIS_DETECTION'
    | 'CONFIDENCE_SCORE'
    | 'SIGNAL_FUSION'
    | 'EMERGENCY_CLASSIFICATION'
    | 'FALLBACK_ACTION'
    | 'GPS_EVENT'
    | 'ALERT_EXECUTION'
    | 'EMERGENCY_RESPONSE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data: any;
  metadata?: {
    userId?: string;
    sessionId?: string;
    source?: string;
    duration?: number;
  };
}

export interface TraceSession {
  traceId: string;
  sessionStart: Date;
  sessionEnd?: Date;
  events: TraceEvent[];
  decisionChain: DecisionNode[];
  actionHistory: ActionRecord[];
  summary?: TraceSummary;
}

export interface DecisionNode {
  nodeId: string;
  timestamp: Date;
  decision: string;
  reasoning: string;
  confidence: number;
  inputs: any;
  outputs: any;
  nextNode?: string;
}

export interface ActionRecord {
  actionId: string;
  timestamp: Date;
  action: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  result?: any;
  error?: string;
  duration?: number;
}

export interface TraceSummary {
  totalEvents: number;
  criticalEvents: number;
  averageConfidence: number;
  emergencyClassification?: string;
  finalDecision?: string;
  alertsSent: number;
  duration: number;
}

class AntigravityTraceLogger {
  private logDir: string;
  private promptsDir: string;
  private tracesDir: string;
  private activeSessions: Map<string, TraceSession>;

  constructor() {
    // Resolve project root dynamically for maximum robustness
    let projectRoot = process.cwd();
    if (existsSync(join(projectRoot, 'apps', 'backend'))) {
      // Already at project root
    } else if (existsSync(join(__dirname, '..', '..', '..', '..', '..'))) {
      projectRoot = join(__dirname, '..', '..', '..', '..', '..');
    }

    // All output goes under antigravity-logs
    this.logDir = join(projectRoot, 'antigravity-logs');
    this.promptsDir = join(this.logDir, 'prompts');
    this.tracesDir = join(this.logDir, 'traces');

    this.ensureDirectories();
    this.activeSessions = new Map();

    logger.info('Antigravity Trace Logger initialized', {
      logDir: this.logDir,
      promptsDir: this.promptsDir,
      tracesDir: this.tracesDir,
    });
  }

  private ensureDirectories(): void {
    [this.logDir, this.promptsDir, this.tracesDir].forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    });
  }

  /**
   * Start a new trace session
   */
  startSession(metadata?: { userId?: string; sessionId?: string }): string {
    const traceId = randomUUID();
    const session: TraceSession = {
      traceId,
      sessionStart: new Date(),
      events: [],
      decisionChain: [],
      actionHistory: [],
    };

    this.activeSessions.set(traceId, session);

    logger.info('Started trace session', { traceId, metadata });

    // Save initial session to Firestore
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      db.collection('antigravity_traces')
        .doc(traceId)
        .set({
          traceId,
          sessionStart: session.sessionStart,
          metadata: metadata || {},
          status: 'STARTED',
        })
        .catch((err) => logger.error('Failed to create Firestore session', { err }));
    }

    // Log session start event
    this.logEvent(traceId, {
      eventType: 'EMERGENCY_RESPONSE',
      severity: 'LOW',
      data: {
        type: 'SESSION_START',
        metadata,
      },
    });

    return traceId;
  }

  /**
   * End a trace session and generate summary
   */
  endSession(traceId: string): void {
    const session = this.activeSessions.get(traceId);
    if (!session) {
      logger.warn('Attempted to end non-existent session', { traceId });
      return;
    }

    session.sessionEnd = new Date();
    session.summary = this.generateSummary(session);

    // Save session to disk
    this.saveSession(session);

    // Remove from active sessions
    this.activeSessions.delete(traceId);

    logger.info('Ended trace session', {
      traceId,
      duration: session.summary.duration,
      totalEvents: session.summary.totalEvents,
    });
  }

  /**
   * Log an event to a trace session
   */
  logEvent(traceId: string, event: Omit<TraceEvent, 'eventId' | 'traceId' | 'timestamp'>): void {
    const session = this.activeSessions.get(traceId);
    if (!session) {
      logger.warn('Attempted to log event to non-existent session', { traceId });
      return;
    }

    const traceEvent: TraceEvent = {
      eventId: randomUUID(),
      traceId,
      timestamp: new Date(),
      ...event,
    };

    session.events.push(traceEvent);

    // Save event to Firestore
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      db.collection('antigravity_traces')
        .doc(traceId)
        .collection('events')
        .doc(traceEvent.eventId)
        .set({
          ...traceEvent,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })
        .catch((err) => logger.error('Failed to log event to Firestore', { err }));
    }

    logger.debug('Logged trace event', {
      traceId,
      eventId: traceEvent.eventId,
      eventType: traceEvent.eventType,
      severity: traceEvent.severity,
    });
  }

  /**
   * Log AI prompt
   */
  logAIPrompt(traceId: string, prompt: string, model: string, metadata?: any): string {
    const promptId = randomUUID();
    const timestamp = new Date().toISOString();

    // Save prompt to file
    const promptData = {
      promptId,
      traceId,
      timestamp,
      model,
      prompt,
      metadata,
    };

    const filename = `prompt_${promptId}_${Date.now()}.json`;
    const filepath = join(this.promptsDir, filename);

    writeFileSync(filepath, JSON.stringify(promptData, null, 2));

    // Log event
    this.logEvent(traceId, {
      eventType: 'AI_PROMPT',
      severity: 'LOW',
      data: {
        promptId,
        model,
        promptLength: prompt.length,
        metadata,
      },
    });

    logger.info('Logged AI prompt', { traceId, promptId, model });

    return promptId;
  }

  /**
   * Log AI response
   */
  logAIResponse(
    traceId: string,
    promptId: string,
    response: string,
    confidence: number,
    metadata?: any
  ): void {
    this.logEvent(traceId, {
      eventType: 'AI_RESPONSE',
      severity: confidence > 0.8 ? 'LOW' : confidence > 0.5 ? 'MEDIUM' : 'HIGH',
      data: {
        promptId,
        response,
        confidence,
        responseLength: response.length,
        metadata,
      },
    });

    logger.info('Logged AI response', { traceId, promptId, confidence });
  }

  /**
   * Log crisis detection
   */
  logCrisisDetection(
    traceId: string,
    detected: boolean,
    confidence: number,
    signals: string[],
    reasoning: string
  ): void {
    this.logEvent(traceId, {
      eventType: 'CRISIS_DETECTION',
      severity: detected ? 'CRITICAL' : 'LOW',
      data: {
        detected,
        confidence,
        signals,
        reasoning,
      },
    });

    logger.info('Logged crisis detection', { traceId, detected, confidence });
  }

  /**
   * Log confidence score
   */
  logConfidenceScore(
    traceId: string,
    score: number,
    factors: Record<string, number>,
    reasoning: string
  ): void {
    this.logEvent(traceId, {
      eventType: 'CONFIDENCE_SCORE',
      severity: score > 0.8 ? 'LOW' : score > 0.5 ? 'MEDIUM' : 'HIGH',
      data: {
        score,
        factors,
        reasoning,
      },
    });
  }

  /**
   * Log signal fusion
   */
  logSignalFusion(
    traceId: string,
    signals: Array<{ source: string; value: any; weight: number }>,
    fusedResult: any,
    confidence: number
  ): void {
    this.logEvent(traceId, {
      eventType: 'SIGNAL_FUSION',
      severity: 'MEDIUM',
      data: {
        signals,
        fusedResult,
        confidence,
        signalCount: signals.length,
      },
    });
  }

  /**
   * Log emergency classification
   */
  logEmergencyClassification(
    traceId: string,
    classification: string,
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    reasoning: string
  ): void {
    this.logEvent(traceId, {
      eventType: 'EMERGENCY_CLASSIFICATION',
      severity: threatLevel,
      data: {
        classification,
        threatLevel,
        reasoning,
      },
    });
  }

  /**
   * Log fallback action
   */
  logFallbackAction(
    traceId: string,
    originalAction: string,
    fallbackAction: string,
    reason: string
  ): void {
    this.logEvent(traceId, {
      eventType: 'FALLBACK_ACTION',
      severity: 'HIGH',
      data: {
        originalAction,
        fallbackAction,
        reason,
      },
    });
  }

  /**
   * Log GPS event
   */
  logGPSEvent(
    traceId: string,
    latitude: number,
    longitude: number,
    accuracy: number,
    address?: string
  ): void {
    this.logEvent(traceId, {
      eventType: 'GPS_EVENT',
      severity: 'LOW',
      data: {
        latitude,
        longitude,
        accuracy,
        address,
      },
    });
  }

  /**
   * Log alert execution
   */
  logAlertExecution(
    traceId: string,
    alertType: string,
    recipients: string[],
    status: 'SUCCESS' | 'FAILED',
    details?: any
  ): void {
    this.logEvent(traceId, {
      eventType: 'ALERT_EXECUTION',
      severity: status === 'FAILED' ? 'HIGH' : 'MEDIUM',
      data: {
        alertType,
        recipients,
        status,
        details,
      },
    });
  }

  /**
   * Add decision node to chain
   */
  addDecisionNode(
    traceId: string,
    decision: string,
    reasoning: string,
    confidence: number,
    inputs: any,
    outputs: any
  ): string {
    const session = this.activeSessions.get(traceId);
    if (!session) return '';

    const nodeId = randomUUID();
    const node: DecisionNode = {
      nodeId,
      timestamp: new Date(),
      decision,
      reasoning,
      confidence,
      inputs,
      outputs,
    };

    session.decisionChain.push(node);

    // Save decision node to Firestore
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      db.collection('antigravity_traces')
        .doc(traceId)
        .collection('decision_chain')
        .doc(nodeId)
        .set({
          ...node,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })
        .catch((err) => logger.error('Failed to log decision node to Firestore', { err }));
    }

    logger.debug('Added decision node', { traceId, nodeId, decision });

    return nodeId;
  }

  /**
   * Add action to history
   */
  addAction(
    traceId: string,
    action: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    result?: any,
    error?: string
  ): string {
    const session = this.activeSessions.get(traceId);
    if (!session) return '';

    const actionId = randomUUID();
    const actionRecord: ActionRecord = {
      actionId,
      timestamp: new Date(),
      action,
      status,
      result,
      error,
    };

    session.actionHistory.push(actionRecord);

    // Save action to Firestore
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      db.collection('antigravity_traces')
        .doc(traceId)
        .collection('action_history')
        .doc(actionId)
        .set({
          ...actionRecord,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })
        .catch((err) => logger.error('Failed to log action to Firestore', { err }));
    }

    logger.debug('Added action record', { traceId, actionId, action, status });

    return actionId;
  }

  /**
   * Update action status
   */
  updateAction(
    traceId: string,
    actionId: string,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    result?: any,
    error?: string
  ): void {
    const session = this.activeSessions.get(traceId);
    if (!session) return;

    const action = session.actionHistory.find((a) => a.actionId === actionId);
    if (!action) return;

    action.status = status;
    action.result = result;
    action.error = error;
    action.duration = Date.now() - action.timestamp.getTime();

    // Update action in Firestore
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      db.collection('antigravity_traces')
        .doc(traceId)
        .collection('action_history')
        .doc(actionId)
        .update({
          status,
          result: result || null,
          error: error || null,
          duration: action.duration,
        })
        .catch((err) => logger.error('Failed to update action in Firestore', { err }));
    }

    logger.debug('Updated action status', { traceId, actionId, status });
  }

  /**
   * Generate session summary
   */
  private generateSummary(session: TraceSession): TraceSummary {
    const criticalEvents = session.events.filter((e) => e.severity === 'CRITICAL').length;
    const confidenceScores = session.events
      .filter((e) => e.eventType === 'CONFIDENCE_SCORE')
      .map((e) => e.data.score);

    const averageConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    const emergencyClassification = session.events.find(
      (e) => e.eventType === 'EMERGENCY_CLASSIFICATION'
    )?.data.classification;

    const finalDecision = session.decisionChain[session.decisionChain.length - 1]?.decision;

    const alertsSent = session.events.filter((e) => e.eventType === 'ALERT_EXECUTION').length;

    const duration = session.sessionEnd
      ? session.sessionEnd.getTime() - session.sessionStart.getTime()
      : 0;

    return {
      totalEvents: session.events.length,
      criticalEvents,
      averageConfidence,
      emergencyClassification,
      finalDecision,
      alertsSent,
      duration,
    };
  }

  /**
   * Save session to disk
   */
  private saveSession(session: TraceSession): void {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const baseFilename = `trace_${session.traceId}_${timestamp}`;

    // Save JSON
    const jsonPath = join(this.tracesDir, `${baseFilename}.json`);
    writeFileSync(jsonPath, JSON.stringify(session, null, 2));

    // Save human-readable markdown
    const mdPath = join(this.tracesDir, `${baseFilename}.md`);
    const markdown = this.generateMarkdown(session);
    writeFileSync(mdPath, markdown);

    // Save final summary to Firestore
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      db.collection('antigravity_traces')
        .doc(session.traceId)
        .update({
          sessionEnd: session.sessionEnd,
          summary: session.summary,
          status: 'COMPLETED',
        })
        .catch((err) => logger.error('Failed to save session summary to Firestore', { err }));
    }

    logger.info('Saved trace session', {
      traceId: session.traceId,
      jsonPath,
      mdPath,
    });
  }

  /**
   * Generate human-readable markdown
   */
  private generateMarkdown(session: TraceSession): string {
    const lines: string[] = [];

    lines.push(`# Antigravity Trace Report`);
    lines.push(`**Trace ID:** ${session.traceId}`);
    lines.push(`**Session Start:** ${session.sessionStart.toISOString()}`);
    lines.push(`**Session End:** ${session.sessionEnd?.toISOString() || 'N/A'}`);
    lines.push('');

    if (session.summary) {
      lines.push(`## Summary`);
      lines.push(`- **Total Events:** ${session.summary.totalEvents}`);
      lines.push(`- **Critical Events:** ${session.summary.criticalEvents}`);
      lines.push(
        `- **Average Confidence:** ${(session.summary.averageConfidence * 100).toFixed(2)}%`
      );
      lines.push(
        `- **Emergency Classification:** ${session.summary.emergencyClassification || 'N/A'}`
      );
      lines.push(`- **Final Decision:** ${session.summary.finalDecision || 'N/A'}`);
      lines.push(`- **Alerts Sent:** ${session.summary.alertsSent}`);
      lines.push(`- **Duration:** ${session.summary.duration}ms`);
      lines.push('');
    }

    lines.push(`## Decision Chain`);
    session.decisionChain.forEach((node, idx) => {
      lines.push(`### ${idx + 1}. ${node.decision}`);
      lines.push(`- **Timestamp:** ${node.timestamp.toISOString()}`);
      lines.push(`- **Confidence:** ${(node.confidence * 100).toFixed(2)}%`);
      lines.push(`- **Reasoning:** ${node.reasoning}`);
      lines.push('');
    });

    lines.push(`## Action History`);
    session.actionHistory.forEach((action, idx) => {
      lines.push(`### ${idx + 1}. ${action.action}`);
      lines.push(`- **Status:** ${action.status}`);
      lines.push(`- **Timestamp:** ${action.timestamp.toISOString()}`);
      if (action.duration) lines.push(`- **Duration:** ${action.duration}ms`);
      if (action.error) lines.push(`- **Error:** ${action.error}`);
      lines.push('');
    });

    lines.push(`## Event Timeline`);
    session.events.forEach((event, idx) => {
      lines.push(`### ${idx + 1}. ${event.eventType} [${event.severity}]`);
      lines.push(`- **Timestamp:** ${event.timestamp.toISOString()}`);
      lines.push(`- **Data:** \`\`\`json\n${JSON.stringify(event.data, null, 2)}\n\`\`\``);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Get active session
   */
  getSession(traceId: string): TraceSession | undefined {
    return this.activeSessions.get(traceId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TraceSession[] {
    return Array.from(this.activeSessions.values());
  }
}

export const antigravityTraceLogger = new AntigravityTraceLogger();
