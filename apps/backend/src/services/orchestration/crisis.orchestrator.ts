import { LoggingReasoningAgent, AgentContext } from './agents';
import {
  SignalFusionAgent,
  CrisisVerificationAgent,
  SeverityPredictionAgent,
  ResourceAllocationAgent,
  CommunicationAgent,
  RecoveryAgent,
  SimulationAgent,
  CrisisSignal,
  CrisisType,
} from './crisis.agents';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('crisis-orchestrator');

export class CrisisOrchestrator {
  private loggingAgent: LoggingReasoningAgent;
  private signalFusion: SignalFusionAgent;
  private verification: CrisisVerificationAgent;
  private severityPrediction: SeverityPredictionAgent;
  private resourceAllocation: ResourceAllocationAgent;
  private communication: CommunicationAgent;
  private recovery: RecoveryAgent;
  private simulation: SimulationAgent;

  constructor() {
    this.loggingAgent = new LoggingReasoningAgent();
    this.signalFusion = new SignalFusionAgent(this.loggingAgent);
    this.verification = new CrisisVerificationAgent(this.loggingAgent);
    this.severityPrediction = new SeverityPredictionAgent(this.loggingAgent);
    this.resourceAllocation = new ResourceAllocationAgent(this.loggingAgent);
    this.communication = new CommunicationAgent(this.loggingAgent);
    this.recovery = new RecoveryAgent(this.loggingAgent);
    this.simulation = new SimulationAgent(this.loggingAgent);
  }

  async processCrisis(context: AgentContext, signals: CrisisSignal[]) {
    this.loggingAgent.log(
      'CrisisOrchestrator',
      'Initialization',
      'Multi-Agent Crisis Detection Workflow Started.'
    );

    try {
      // 1. Signal Fusion
      const fusedData = await this.signalFusion.fuse(signals);

      // 2. Verification
      const isVerified = await this.verification.verify(fusedData);
      if (!isVerified) {
        this.loggingAgent.log(
          'CrisisOrchestrator',
          'Termination',
          'Crisis could not be verified. Stopping workflow.'
        );
        return { success: false, reason: 'unverified', trace: this.loggingAgent.getTrace() };
      }

      // 3. Severity & Impact Prediction
      const impact = await this.severityPrediction.predict(context, signals);

      // 4. Resource Allocation
      const allocation = await this.resourceAllocation.allocate(
        impact,
        context.location || { latitude: 0, longitude: 0 }
      );

      // 5. Impact Simulation
      const simulation = await this.simulation.simulate(impact, allocation);

      // 6. Stakeholder Communication
      const communication = await this.communication.notifyStakeholders({ impact, allocation });

      // 7. Recovery Planning
      const recoveryPlan = await this.recovery.planRecovery({ impact });

      this.loggingAgent.log(
        'CrisisOrchestrator',
        'Completion',
        'Crisis managed successfully. All agents completed tasks.'
      );

      return {
        success: true,
        incidentId: crypto.randomUUID(),
        impact,
        allocation,
        simulation,
        recoveryPlan,
        trace: this.loggingAgent.getTrace(),
      };
    } catch (error: any) {
      this.loggingAgent.log(
        'CrisisOrchestrator',
        'Error',
        `Critical workflow failure: ${error.message}`
      );
      return { success: false, error: error.message, trace: this.loggingAgent.getTrace() };
    }
  }
}

export const crisisOrchestrator = new CrisisOrchestrator();
