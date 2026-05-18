import { createLogger } from '@silentsiren/logger';

const logger = createLogger('trace-service');

export interface TraceStep {
  agentId: string;
  phase: 'thought' | 'action' | 'observation' | 'conclusion';
  content: string;
  data?: any;
  timestamp: string;
}

export interface CrisisTrace {
  incidentId: string;
  startTime: string;
  endTime?: string;
  steps: TraceStep[];
}

export class TraceService {
  private activeTraces: Map<string, CrisisTrace> = new Map();

  startTrace(incidentId: string): CrisisTrace {
    const trace: CrisisTrace = {
      incidentId,
      startTime: new Date().toISOString(),
      steps: []
    };
    this.activeTraces.set(incidentId, trace);
    return trace;
  }

  addStep(incidentId: string, step: Omit<TraceStep, 'timestamp'>) {
    const trace = this.activeTraces.get(incidentId);
    if (trace) {
      const fullStep = { ...step, timestamp: new Date().toISOString() };
      trace.steps.push(fullStep);
      logger.debug({ incidentId, agentId: step.agentId }, `Trace added: ${step.content}`);
    }
  }

  getTrace(incidentId: string): CrisisTrace | undefined {
    return this.activeTraces.get(incidentId);
  }

  completeTrace(incidentId: string) {
    const trace = this.activeTraces.get(incidentId);
    if (trace) {
      trace.endTime = new Date().toISOString();
    }
  }
}

export const traceService = new TraceService();
