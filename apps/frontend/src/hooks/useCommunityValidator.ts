import { useState, useCallback } from 'react';
import { validatorClient } from '../lib/validatorClient';
import { ValidationResult, UserReputation } from '@silentsiren/shared-types';

interface SubmitIncidentData {
  userId: string;
  deviceId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  aiAnalysis: {
    confidence: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reasoning: string;
    audioPatterns?: string[];
  };
  audioClipUrl?: string;
}

interface SubmitIncidentResult {
  incidentId: string;
  validation: ValidationResult;
  reputation: UserReputation;
  remainingQuota?: number;
}

interface UseCommunityValidatorReturn {
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submitIncident: (data: SubmitIncidentData) => Promise<SubmitIncidentResult | null>;
  getValidationStatus: (incidentId: string) => Promise<ValidationResult | null>;
  getUserReputation: (userId: string) => Promise<UserReputation | null>;
  clearError: () => void;
}

export function useCommunityValidator(): UseCommunityValidatorReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitIncident = useCallback(
    async (data: SubmitIncidentData): Promise<SubmitIncidentResult | null> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await validatorClient.submitIncident(data);

        return {
          incidentId: response.incident.id,
          validation: response.validation,
          reputation: response.reputation,
          remainingQuota: response.remainingQuota,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit incident';
        setError(errorMessage);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const getValidationStatus = useCallback(
    async (incidentId: string): Promise<ValidationResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await validatorClient.getValidationStatus(incidentId);
        return response.validation;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get validation status';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getUserReputation = useCallback(async (userId: string): Promise<UserReputation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await validatorClient.getUserReputation(userId);
      return response.reputation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user reputation';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    isLoading,
    error,
    submitIncident,
    getValidationStatus,
    getUserReputation,
    clearError,
  };
}
