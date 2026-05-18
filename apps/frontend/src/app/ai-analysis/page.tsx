'use client';

import { useState } from 'react';
import { analyzeAudioWithAI, testAIAnalysis } from '@/lib/aiClient';
import { AIAnalysisResult } from '@silentsiren/shared-types';
import { motion } from 'framer-motion';

export default function AIAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await testAIAnalysis();
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Audio Analysis</h1>
          <p className="text-gray-600 mb-6">Gemini 1.5 Flash multimodal audio reasoning</p>

          <div className="space-y-4">
            <button
              onClick={handleTestAnalysis}
              disabled={isAnalyzing}
              className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Test Analysis'}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Error: {error}</p>
              </div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className={`p-6 border-2 rounded-lg ${getThreatColor(result.threatLevel)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Analysis Result</h2>
                    <span className="px-4 py-2 rounded-full font-bold text-lg">
                      {result.threatLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Confidence</div>
                      <div className="text-3xl font-bold">
                        {(result.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Emotional Stress</div>
                      <div className="text-3xl font-bold">
                        {(result.emotionalStress * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-1">Dispatch Recommended</div>
                    <div className="text-2xl font-bold">
                      {result.dispatchRecommended ? '✓ YES' : '✗ NO'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Reasoning</div>
                    <p className="text-base">{result.reasoning}</p>
                  </div>

                  {result.detectedPatterns.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-2">Detected Patterns</div>
                      <div className="flex flex-wrap gap-2">
                        {result.detectedPatterns.map((pattern, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white rounded-full text-sm font-medium"
                          >
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Audio Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          result.audioFeatures.hasScream ? 'text-red-600' : 'text-gray-400'
                        }
                      >
                        {result.audioFeatures.hasScream ? '✓' : '✗'}
                      </span>
                      <span className="text-sm">Scream</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={result.audioFeatures.hasPanic ? 'text-red-600' : 'text-gray-400'}
                      >
                        {result.audioFeatures.hasPanic ? '✓' : '✗'}
                      </span>
                      <span className="text-sm">Panic</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          result.audioFeatures.hasImpactSound ? 'text-red-600' : 'text-gray-400'
                        }
                      >
                        {result.audioFeatures.hasImpactSound ? '✓' : '✗'}
                      </span>
                      <span className="text-sm">Impact Sound</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="text-xs text-gray-600">Breathing</div>
                      <div className="text-sm font-medium capitalize">
                        {result.audioFeatures.breathingPattern}
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="text-xs text-gray-600">Background Noise</div>
                      <div className="text-sm font-medium capitalize">
                        {result.audioFeatures.backgroundNoise}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              <strong>1. Audio Upload:</strong> Audio clips are sent to Gemini 1.5 Flash
            </p>
            <p>
              <strong>2. Multimodal Analysis:</strong> AI analyzes audio for distress signals
            </p>
            <p>
              <strong>3. Pattern Detection:</strong> Identifies screams, panic, impact sounds
            </p>
            <p>
              <strong>4. Confidence Scoring:</strong> Provides certainty level (0-100%)
            </p>
            <p>
              <strong>5. Threat Classification:</strong> Categorizes as LOW, MEDIUM, HIGH, or
              CRITICAL
            </p>
            <p>
              <strong>6. Dispatch Decision:</strong> Recommends whether to alert emergency contacts
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Safety Features</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>✓ Prompt injection defense</li>
            <li>✓ Response validation and sanitization</li>
            <li>✓ Hallucination safeguards</li>
            <li>✓ Retry handling with exponential backoff</li>
            <li>✓ Conservative false positive prevention</li>
            <li>✓ Structured JSON output enforcement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
