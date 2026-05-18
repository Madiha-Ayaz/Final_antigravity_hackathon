import { createLogger } from '@silentsiren/logger';
import { antigravityTrace } from './antigravityTrace';

const logger = createLogger('alert-retry');

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

interface AlertFunction {
  (): Promise<any>;
}

interface FallbackChain {
  primary: { type: string; fn: AlertFunction; recipients: string[] };
  fallbacks: Array<{ type: string; fn: AlertFunction; recipients: string[] }>;
}

/**
 * Alert Retry and Fallback Manager
 * Handles retry logic with exponential backoff and automatic fallback to alternative channels
 */
class AlertRetryManager {
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  };

  /**
   * Execute alert with retry logic
   */
  async executeWithRetry(
    traceId: string,
    alertType: string,
    recipients: string[],
    alertFn: AlertFunction,
    config?: Partial<RetryConfig>
  ): Promise<{ success: boolean; result?: any; error?: string; attempts: number }> {
    const retryConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;
    let attempt = 0;

    for (attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        logger.info(`Attempting ${alertType} alert`, {
          traceId,
          attempt,
          maxRetries: retryConfig.maxRetries,
        });

        const result = await alertFn();

        logger.info(`${alertType} alert succeeded`, {
          traceId,
          attempt,
        });

        return {
          success: true,
          result,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error as Error;

        logger.warn(`${alertType} alert failed`, {
          traceId,
          attempt,
          error: lastError.message,
        });

        // Don't retry on last attempt
        if (attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
            retryConfig.maxDelayMs
          );

          logger.info(`Retrying ${alertType} alert after delay`, {
            traceId,
            delayMs: delay,
            nextAttempt: attempt + 1,
          });

          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      attempts: attempt,
    };
  }

  /**
   * Execute alert with automatic fallback to alternative channels
   */
  async executeWithFallback(
    traceId: string,
    fallbackChain: FallbackChain
  ): Promise<{
    success: boolean;
    channelUsed: string;
    result?: any;
    error?: string;
    fallbacksTriggered: number;
  }> {
    const { primary, fallbacks } = fallbackChain;

    // Try primary channel with retry
    logger.info('Attempting primary alert channel', {
      traceId,
      channel: primary.type,
    });

    const primaryResult = await antigravityTrace.logAlertExecution(
      traceId,
      primary.type,
      primary.recipients,
      async () => {
        const result = await this.executeWithRetry(
          traceId,
          primary.type,
          primary.recipients,
          primary.fn
        );

        if (!result.success) {
          throw new Error(result.error || 'Alert failed');
        }

        return result.result;
      }
    );

    if (primaryResult.status === 'SUCCESS') {
      return {
        success: true,
        channelUsed: primary.type,
        result: primaryResult.details,
        fallbacksTriggered: 0,
      };
    }

    // Primary failed, try fallbacks
    logger.warn('Primary alert channel failed, trying fallbacks', {
      traceId,
      primaryChannel: primary.type,
      fallbackCount: fallbacks.length,
    });

    for (let i = 0; i < fallbacks.length; i++) {
      const fallback = fallbacks[i];

      // Log fallback trigger
      antigravityTrace.logFallback(
        traceId,
        i === 0 ? primary.type : fallbacks[i - 1].type,
        fallback.type,
        `Previous channel failed after retries`
      );

      logger.info('Attempting fallback channel', {
        traceId,
        channel: fallback.type,
        fallbackIndex: i + 1,
      });

      const fallbackResult = await antigravityTrace.logAlertExecution(
        traceId,
        fallback.type,
        fallback.recipients,
        async () => {
          const result = await this.executeWithRetry(
            traceId,
            fallback.type,
            fallback.recipients,
            fallback.fn
          );

          if (!result.success) {
            throw new Error(result.error || 'Alert failed');
          }

          return result.result;
        }
      );

      if (fallbackResult.status === 'SUCCESS') {
        logger.info('Fallback channel succeeded', {
          traceId,
          channel: fallback.type,
          fallbackIndex: i + 1,
        });

        return {
          success: true,
          channelUsed: fallback.type,
          result: fallbackResult.details,
          fallbacksTriggered: i + 1,
        };
      }
    }

    // All channels failed
    logger.error('All alert channels failed', {
      traceId,
      primaryChannel: primary.type,
      fallbacksAttempted: fallbacks.length,
    });

    return {
      success: false,
      channelUsed: 'NONE',
      error: 'All alert channels exhausted',
      fallbacksTriggered: fallbacks.length,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const alertRetryManager = new AlertRetryManager();
