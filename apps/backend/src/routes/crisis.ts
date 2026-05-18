import { Router, Request, Response } from 'express';
import { crisisOrchestrator } from '../services/orchestration/crisis.orchestrator';
import { CrisisSignal } from '../services/orchestration/crisis.agents';

const router = Router();

// Trigger a crisis workflow
router.post('/trigger', async (req: Request, res: Response) => {
  const { userId, transcript, location, signals } = req.body;

  const context = {
    userId: userId || 'anonymous',
    transcript: transcript || 'N/A',
    location: location || { latitude: 0, longitude: 0 }
  };

  // Default signals if none provided (for demo)
  const crisisSignals: CrisisSignal[] = signals || [
    { type: 'voice', source: 'user-mic', data: { threat: 'high' }, confidence: 0.92 },
    { type: 'weather', source: 'accuweather', data: { condition: 'heavy_rain' }, confidence: 0.85 }
  ];

  const result = await crisisOrchestrator.processCrisis(context, crisisSignals);

  if (result.success) {
    res.json(result);
  } else {
    res.status(result.reason === 'unverified' ? 200 : 500).json(result);
  }
});

// Demo scenarios
router.post('/scenario/:type', async (req: Request, res: Response) => {
  const { type } = req.params;
  
  let signals: CrisisSignal[] = [];

  switch (type) {
    case 'flood':
      signals = [
        { type: 'weather', source: 'sat-view', data: { water_level: 'critical' }, confidence: 0.95 },
        { type: 'citizen', source: 'mobile-app', data: { report: 'street flooding' }, confidence: 0.80 }
      ];
      break;
    case 'fire':
      signals = [
        { type: 'sensor', source: 'iot-smoke', data: { smoke_density: 0.9 }, confidence: 0.99 },
        { type: 'voice', source: 'call-center', data: { panic: true }, confidence: 0.85 }
      ];
      break;
    case 'false_alarm':
      signals = [
        { type: 'voice', source: 'user-mic', data: { transcript: 'just kidding' }, confidence: 0.2 },
        { type: 'sensor', source: 'iot-temp', data: { temp: 22 }, confidence: 0.99 }
      ];
      break;
    default:
      return res.status(400).json({ success: false, message: 'Unknown scenario' });
  }

  const result = await crisisOrchestrator.processCrisis(
    { userId: 'demo-system', transcript: `Scenario: ${type}`, location: { latitude: 31.5204, longitude: 74.3587 } },
    signals
  );

  res.json(result);
});

export default router;
