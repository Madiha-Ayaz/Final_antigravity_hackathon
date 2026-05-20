import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@silentsiren/config';
import { createLogger } from '@silentsiren/logger';
import { AIAnalysisResult, ThreatLevel } from '@silentsiren/shared-types';
import { AUDIO_ANALYSIS_PROMPT } from './antigravity/prompts';

const logger = createLogger('gemini-service');

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: config.GEMINI_MODEL || 'gemini-1.5-flash',
    });
  }

  async analyzeAudio(audioBuffer: Buffer): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting audio analysis with Gemini');

      const prompt = this.buildAnalysisPrompt();

      const audioPart = {
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType: 'audio/wav',
        },
      };

      const result = await this.model.generateContent([prompt, audioPart]);
      const response = await result.response;
      const text = response.text();

      logger.info(
        {
          duration: Date.now() - startTime,
          responseLength: text.length,
        },
        'Gemini analysis complete'
      );

      const analysis = this.parseResponse(text);

      return this.validateAndSanitize(analysis);
    } catch (error) {
      logger.error({ error, duration: Date.now() - startTime }, 'Gemini analysis failed');
      throw new Error('Failed to analyze audio with Gemini');
    }
  }

  private buildAnalysisPrompt(): string {
    return AUDIO_ANALYSIS_PROMPT;
  }

  private parseResponse(text: string): AIAnalysisResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        confidence: parsed.confidence,
        threatLevel: parsed.threatLevel as ThreatLevel,
        reasoning: parsed.reasoning,
        dispatchRecommended: parsed.dispatchRecommended,
        detectedPatterns: parsed.detectedPatterns || [],
        emotionalStress: parsed.emotionalStress,
        audioFeatures: {
          hasScream: parsed.audioFeatures?.hasScream || false,
          hasPanic: parsed.audioFeatures?.hasPanic || false,
          hasImpactSound: parsed.audioFeatures?.hasImpactSound || false,
          breathingPattern: parsed.audioFeatures?.breathingPattern || 'normal',
          backgroundNoise: parsed.audioFeatures?.backgroundNoise || 'low',
        },
      };
    } catch (error) {
      logger.error({ error, text }, 'Failed to parse Gemini response');
      throw new Error('Invalid response format from Gemini');
    }
  }

  private validateAndSanitize(analysis: AIAnalysisResult): AIAnalysisResult {
    const sanitized: AIAnalysisResult = {
      confidence: Math.max(0, Math.min(1, analysis.confidence)),
      threatLevel: this.validateThreatLevel(analysis.threatLevel),
      reasoning: this.sanitizeText(analysis.reasoning),
      dispatchRecommended: Boolean(analysis.dispatchRecommended),
      detectedPatterns: analysis.detectedPatterns
        .map((p) => this.sanitizeText(p))
        .filter((p) => p.length > 0)
        .slice(0, 10),
      emotionalStress: Math.max(0, Math.min(1, analysis.emotionalStress)),
      audioFeatures: {
        hasScream: Boolean(analysis.audioFeatures.hasScream),
        hasPanic: Boolean(analysis.audioFeatures.hasPanic),
        hasImpactSound: Boolean(analysis.audioFeatures.hasImpactSound),
        breathingPattern: this.validateBreathingPattern(analysis.audioFeatures.breathingPattern),
        backgroundNoise: this.validateBackgroundNoise(analysis.audioFeatures.backgroundNoise),
      },
    };

    if (sanitized.confidence < 0.3) {
      sanitized.dispatchRecommended = false;
    }

    if (sanitized.threatLevel === 'LOW' && sanitized.dispatchRecommended) {
      sanitized.dispatchRecommended = false;
    }

    logger.info({ sanitized }, 'Analysis validated and sanitized');

    return sanitized;
  }

  private validateThreatLevel(level: string): ThreatLevel {
    const validLevels: ThreatLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    return validLevels.includes(level as ThreatLevel) ? (level as ThreatLevel) : 'LOW';
  }

  private validateBreathingPattern(pattern: string): 'normal' | 'rapid' | 'distressed' {
    const validPatterns = ['normal', 'rapid', 'distressed'];
    return validPatterns.includes(pattern) ? (pattern as any) : 'normal';
  }

  private validateBackgroundNoise(noise: string): 'low' | 'medium' | 'high' {
    const validNoise = ['low', 'medium', 'high'];
    return validNoise.includes(noise) ? (noise as any) : 'low';
  }

  private sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';

    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim()
      .slice(0, 500);
  }

  async analyzeWithRetry(
    audioBuffer: Buffer,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<AIAnalysisResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info({ attempt, maxRetries }, 'Attempting audio analysis');
        return await this.analyzeAudio(audioBuffer);
      } catch (error) {
        lastError = error as Error;
        logger.warn({ attempt, maxRetries, error }, 'Analysis attempt failed');

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    logger.error({ maxRetries, error: lastError }, 'All analysis attempts failed');
    throw lastError || new Error('Analysis failed after retries');
  }
}

export const geminiService = new GeminiService();
