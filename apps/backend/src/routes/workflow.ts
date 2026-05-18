import { Router, Request, Response } from 'express';
import { orchestrator } from '../services/orchestration/workflow';
import { createLogger } from '@silentsiren/logger';

const router = Router();
const logger = createLogger('workflow-route');

// Remove authentication for demo - allow direct access
router.post('/trigger', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, transcript, location } = req.body;
    
    if (!userId || !transcript) {
      res.status(400).json({ success: false, message: 'userId and transcript are required' });
      return;
    }
    
    const context = {
      userId,
      transcript,
      location,
      timestamp: new Date().toISOString()
    };
    
    const traceLogs = await orchestrator.runWorkflow(context);
    
    res.status(200).json({
      success: true,
      logs: traceLogs
    });
  } catch (error) {
    logger.error('Error in workflow execution', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Test endpoint
router.get('/test', async (req: Request, res: Response): Promise<void> => {
    try {
        const testContext = {
            userId: 'test-user-123',
            transcript: 'Oh my god, someone help me, he has a gun!',
            location: { latitude: 37.7749, longitude: -122.4194 },
            timestamp: new Date().toISOString()
        };
        
        const traceLogs = await orchestrator.runWorkflow(testContext);
        
        res.status(200).json({
            success: true,
            logs: traceLogs
        });
    } catch (error) {
        logger.error('Error in workflow test', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

export default router;
