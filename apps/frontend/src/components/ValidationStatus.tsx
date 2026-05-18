'use client';

import { ValidationResult } from '@silentsiren/shared-types';
import { motion } from 'framer-motion';

interface ValidationStatusProps {
  validation: ValidationResult;
  className?: string;
}

export function ValidationStatus({ validation, className = '' }: ValidationStatusProps) {
  const {
    isValidated,
    validationScore,
    nearbyIncidentCount,
    consensusReached,
    reasoning,
    shouldDispatch,
    nearbyIncidents,
  } = validation;

  const getStatusColor = () => {
    if (consensusReached) return 'text-green-600 bg-green-50 border-green-200';
    if (nearbyIncidentCount > 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = () => {
    if (consensusReached) return '✓';
    if (nearbyIncidentCount > 0) return '⚠';
    return 'ℹ';
  };

  const getStatusText = () => {
    if (consensusReached) return 'Validated';
    if (nearbyIncidentCount > 0) return 'Pending Validation';
    return 'No Nearby Incidents';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border-2 p-6 ${getStatusColor()} ${className}`}
    >
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getStatusIcon()}</span>
          <div>
            <h3 className="text-lg font-semibold">{getStatusText()}</h3>
            <p className="text-sm opacity-75">
              Validation Score: {(validationScore * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        {shouldDispatch && (
          <span className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full">
            Dispatch Recommended
          </span>
        )}
      </div>

      {/* Reasoning */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-1">Analysis:</p>
        <p className="text-sm opacity-90">{reasoning}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white bg-opacity-50 rounded p-3">
          <p className="text-xs font-medium opacity-75 mb-1">Nearby Incidents</p>
          <p className="text-2xl font-bold">{nearbyIncidentCount}</p>
        </div>
        <div className="bg-white bg-opacity-50 rounded p-3">
          <p className="text-xs font-medium opacity-75 mb-1">Consensus</p>
          <p className="text-2xl font-bold">{consensusReached ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Nearby Incidents Details */}
      {nearbyIncidents.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Nearby Incidents:</p>
          <div className="space-y-2">
            {nearbyIncidents.map((incident, index) => (
              <div key={incident.id} className="bg-white bg-opacity-50 rounded p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Incident #{index + 1}</span>
                  <span className="text-xs opacity-75">{incident.distance.toFixed(0)}m away</span>
                </div>
                <div className="mt-1 flex justify-between text-xs opacity-75">
                  <span>Confidence: {(incident.confidence * 100).toFixed(1)}%</span>
                  <span>{incident.timeDiff.toFixed(0)}s ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
