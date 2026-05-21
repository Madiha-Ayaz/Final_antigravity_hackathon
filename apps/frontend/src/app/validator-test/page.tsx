'use client';

import { useState } from 'react';
import { useCommunityValidator } from '@/hooks/useCommunityValidator';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ValidationStatus } from '@/components/ValidationStatus';
import { ValidationResult } from '@silentsiren/shared-types';

export default function ValidatorTestPage() {
  const { submitIncident, getValidationStatus, getUserReputation, isSubmitting, error } =
    useCommunityValidator();
  const {
    position: location,
    requestPosition: getLocation,
    isLoading: isLoadingLocation,
  } = useGeolocation();

  const [userId, setUserId] = useState('test-user-' + Math.random().toString(36).substr(2, 9));
  const [deviceId] = useState('device-' + Math.random().toString(36).substr(2, 9));
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [reputation, setReputation] = useState<any>(null);

  const handleSubmitIncident = async () => {
    if (!location) {
      alert('Please enable location first');
      return;
    }

    const result = await submitIncident({
      userId,
      deviceId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
      aiAnalysis: {
        confidence: 0.85,
        threatLevel: 'HIGH',
        reasoning: 'Test incident for community validation',
        audioPatterns: ['scream', 'panic'],
      },
    });

    if (result) {
      setIncidentId(result.incidentId);
      setValidation(result.validation);
      setReputation(result.reputation);
    }
  };

  const handleCheckStatus = async () => {
    if (!incidentId) {
      alert('No incident ID available');
      return;
    }

    const result = await getValidationStatus(incidentId);
    if (result) {
      setValidation(result);
    }
  };

  const handleGetReputation = async () => {
    const result = await getUserReputation(userId);
    if (result) {
      setReputation(result);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Validator Test</h1>
        <p className="text-gray-600 mb-8">
          Test the community validation system with simulated incidents
        </p>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
              <input
                type="text"
                value={deviceId}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          {location ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Latitude:</span> {location.latitude.toFixed(6)}
              </p>
              <p>
                <span className="font-medium">Longitude:</span> {location.longitude.toFixed(6)}
              </p>
              <p>
                <span className="font-medium">Accuracy:</span>{' '}
                {location.accuracy !== undefined ? `${location.accuracy.toFixed(0)}m` : 'N/A'}
              </p>
            </div>
          ) : (
            <button
              onClick={getLocation}
              disabled={isLoadingLocation}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingLocation ? 'Getting Location...' : 'Enable Location'}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleSubmitIncident}
              disabled={isSubmitting || !location}
              className="bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Incident'}
            </button>
            <button
              onClick={handleCheckStatus}
              disabled={!incidentId}
              className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Check Status
            </button>
            <button
              onClick={handleGetReputation}
              className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Get Reputation
            </button>
          </div>
        </div>

        {/* Incident ID */}
        {incidentId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Incident ID</h2>
            <p className="text-sm font-mono bg-gray-100 p-3 rounded">{incidentId}</p>
          </div>
        )}

        {/* Validation Result */}
        {validation && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Validation Result</h2>
            <ValidationStatus validation={validation} />
          </div>
        )}

        {/* Reputation */}
        {reputation && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">User Reputation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600 mb-1">Score</p>
                <p className="text-2xl font-bold text-gray-900">{reputation.score}</p>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600 mb-1">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{reputation.totalIncidents}</p>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600 mb-1">Validated</p>
                <p className="text-2xl font-bold text-green-600">{reputation.validatedIncidents}</p>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600 mb-1">False Alarms</p>
                <p className="text-2xl font-bold text-red-600">{reputation.falseAlarms}</p>
              </div>
            </div>
            {reputation.isBanned && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded p-4">
                <p className="text-red-800 font-semibold">⚠ User is banned</p>
                {reputation.banReason && (
                  <p className="text-red-700 text-sm mt-1">Reason: {reputation.banReason}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Enable location access</li>
            <li>Submit an incident (simulates emergency detection)</li>
            <li>Open this page in multiple tabs/devices with same location</li>
            <li>Submit incidents from different users at same location</li>
            <li>Check validation status to see community consensus</li>
            <li>View reputation scores and statistics</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
