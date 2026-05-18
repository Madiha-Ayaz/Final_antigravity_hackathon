import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { geminiService } from '../services/gemini.service';
import { createLogger } from '@silentsiren/logger';
import { z } from 'zod';

const router = Router();
const logger = createLogger('ai-routes');

const analyzeAudioSchema = z.object({
  audioData: z.string().min(1, 'Audio data is required'),
  mimeType: z.string().optional().default('audio/wav'),
});

// Remove authentication for demo - allow direct access
router.post(
  '/analyze-audio',
  async (req: Request, res: Response) => {
    try {
      const validation = analyzeAudioSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        });
      }

      const { audioData } = validation.data;

      logger.info('Audio analysis requested');

      const audioBuffer = Buffer.from(audioData, 'base64');

      if (audioBuffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_AUDIO',
            message: 'Audio data is empty',
          },
        });
      }

      if (audioBuffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'AUDIO_TOO_LARGE',
            message: 'Audio file must be less than 10MB',
          },
        });
      }

      const analysis = await geminiService.analyzeWithRetry(audioBuffer);

      logger.info(
        {
          threatLevel: analysis.threatLevel,
          confidence: analysis.confidence,
          dispatchRecommended: analysis.dispatchRecommended,
        },
        'Audio analysis complete'
      );

      res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Audio analysis failed');
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: 'Failed to analyze audio',
        },
      });
    }
  }
);

// Remove authentication for demo
router.post('/test-analysis', async (req: Request, res: Response) => {
  try {
    logger.info('Test analysis requested');

    const mockAnalysis = {
      confidence: 0.85,
      threatLevel: 'HIGH' as const,
      reasoning: 'Test analysis - detected distress patterns in audio',
      dispatchRecommended: true,
      detectedPatterns: ['panic voice', 'rapid breathing'],
      emotionalStress: 0.9,
      audioFeatures: {
        hasScream: true,
        hasPanic: true,
        hasImpactSound: false,
        breathingPattern: 'distressed' as const,
        backgroundNoise: 'medium' as const,
      },
    };

    res.json({
      success: true,
      data: mockAnalysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Test analysis failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'TEST_FAILED',
        message: 'Test analysis failed',
      },
    });
  }
});

export default router;
