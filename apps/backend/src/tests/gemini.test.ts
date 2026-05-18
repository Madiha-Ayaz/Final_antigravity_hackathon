import { geminiService } from '../services/gemini.service';
import { createLogger } from '@silentsiren/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('gemini-test');

async function testGeminiService() {
  try {
    logger.info('Starting Gemini service test');

    const testAudioPath = path.join(__dirname, '../../test-audio/sample.wav');

    if (!fs.existsSync(testAudioPath)) {
      logger.warn('Test audio file not found, creating mock buffer');
      const mockBuffer = Buffer.alloc(1024);
      const result = await geminiService.analyzeWithRetry(mockBuffer);
      logger.info({ result }, 'Mock analysis complete');
      return;
    }

    const audioBuffer = fs.readFileSync(testAudioPath);
    logger.info({ size: audioBuffer.length }, 'Loaded test audio');

    const result = await geminiService.analyzeWithRetry(audioBuffer);

    logger.info({ result }, 'Analysis complete');

    console.log('\n=== Gemini Analysis Result ===');
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Threat Level: ${result.threatLevel}`);
    console.log(`Dispatch Recommended: ${result.dispatchRecommended}`);
    console.log(`Emotional Stress: ${(result.emotionalStress * 100).toFixed(1)}%`);
    console.log(`Reasoning: ${result.reasoning}`);
    console.log(`Detected Patterns: ${result.detectedPatterns.join(', ')}`);
    console.log('\nAudio Features:');
    console.log(`  - Has Scream: ${result.audioFeatures.hasScream}`);
    console.log(`  - Has Panic: ${result.audioFeatures.hasPanic}`);
    console.log(`  - Has Impact Sound: ${result.audioFeatures.hasImpactSound}`);
    console.log(`  - Breathing Pattern: ${result.audioFeatures.breathingPattern}`);
    console.log(`  - Background Noise: ${result.audioFeatures.backgroundNoise}`);
    console.log('==============================\n');
  } catch (error) {
    logger.error({ error }, 'Test failed');
    console.error('Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testGeminiService()
    .then(() => {
      logger.info('Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, 'Test failed with error');
      process.exit(1);
    });
}

export { testGeminiService };
