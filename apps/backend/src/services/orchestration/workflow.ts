import {
  LoggingReasoningAgent,
  AudioAnalysisAgent,
  VerificationAgent,
  CommunityValidationAgent,
  DispatchAgent,
  AgentContext,
} from './agents';

export class AgenticWorkflowOrchestrator {
  async runWorkflow(context: AgentContext) {
    const loggingAgent = new LoggingReasoningAgent();
    loggingAgent.log(
      'Orchestrator',
      'Initialization',
      'Agentic Workflow Started for incoming emergency signal.'
    );

    try {
      // 1. Audio Analysis
      const audioAgent = new AudioAnalysisAgent(loggingAgent);
      const audioResult = await audioAgent.analyze(context);

      if (audioResult.confidence === 'Low') {
        loggingAgent.log(
          'Orchestrator',
          'Termination',
          'Audio confidence is Low. Filtering out as noise/casual conversation.'
        );
        return loggingAgent.getTrace();
      }

      // 2. Verification
      const verificationAgent = new VerificationAgent(loggingAgent);
      const verificationResult = await verificationAgent.verify(context);

      if (verificationResult.verified) {
        loggingAgent.log('Orchestrator', 'Termination', 'User marked as safe. Workflow aborted.');
        return loggingAgent.getTrace();
      }

      // 3. Community Validation
      const communityAgent = new CommunityValidationAgent(loggingAgent);
      await communityAgent.validate();

      // 4. Dispatch
      const dispatchAgent = new DispatchAgent(loggingAgent);
      await dispatchAgent.dispatch(context, audioResult.confidence);

      loggingAgent.log('Orchestrator', 'Completion', 'Full Agentic Workflow Execution Completed.');
      return loggingAgent.getTrace();
    } catch (error: any) {
      loggingAgent.log('Orchestrator', 'Error', `Workflow failed: ${error.message}`);
      throw error;
    }
  }
}

export const orchestrator = new AgenticWorkflowOrchestrator();
