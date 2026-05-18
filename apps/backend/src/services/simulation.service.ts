import { createLogger } from '@silentsiren/logger';

const logger = createLogger('simulation-service');

export interface SimulationResult {
  scenario: string;
  before: {
    responseTime: number;
    riskScore: number;
    congestion: number;
  };
  after: {
    responseTime: number;
    riskScore: number;
    congestion: number;
  };
  improvement: {
    timeReduction: number;
    riskReduction: number;
    costEfficiency: number;
  };
}

export class SimulationService {
  async runCrisisSimulation(crisisType: string, allocation: any): Promise<SimulationResult> {
    logger.info({ crisisType }, 'Running impact simulation');

    // Business logic for simulation
    const baseResponse = 15; // 15 mins
    const allocatedUnits = allocation.length;
    const timeReduction = allocatedUnits * 2.5; // Each unit reduces 2.5 mins

    return {
      scenario: crisisType,
      before: {
        responseTime: baseResponse,
        riskScore: 0.85,
        congestion: 0.7
      },
      after: {
        responseTime: Math.max(baseResponse - timeReduction, 3),
        riskScore: 0.2,
        congestion: 0.3
      },
      improvement: {
        timeReduction: timeReduction,
        riskReduction: 0.65,
        costEfficiency: 0.8
      }
    };
  }
}

export const simulationService = new SimulationService();
