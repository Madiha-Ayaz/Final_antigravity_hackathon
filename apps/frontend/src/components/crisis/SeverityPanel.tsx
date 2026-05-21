import React from 'react';

interface SeverityProps {
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  radius: number;
  duration: number;
}

const SeverityPanel: React.FC<SeverityProps> = ({ level, confidence, radius, duration }) => {
  const getColors = () => {
    switch (level) {
      case 'Critical':
        return 'from-red-600 to-rose-600 border-red-500/50 text-red-50';
      case 'High':
        return 'from-orange-600 to-amber-600 border-orange-500/50 text-orange-50';
      case 'Medium':
        return 'from-indigo-600 to-blue-600 border-indigo-500/50 text-indigo-50';
      default:
        return 'from-emerald-600 to-teal-600 border-emerald-500/50 text-emerald-50';
    }
  };

  return (
    <div className={`rounded-2xl p-6 border bg-gradient-to-br ${getColors()} shadow-2xl`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
            Current Status
          </p>
          <h2 className="text-4xl font-black tracking-tight">{level} Threat</h2>
        </div>
        <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span className="text-sm font-bold">AI Verified: {(confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Impact Radius</p>
          <p className="text-xl font-bold">{radius} km</p>
        </div>
        <div className="bg-black/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Est. Duration</p>
          <p className="text-xl font-bold">{duration} hrs</p>
        </div>
      </div>
    </div>
  );
};

export default SeverityPanel;
