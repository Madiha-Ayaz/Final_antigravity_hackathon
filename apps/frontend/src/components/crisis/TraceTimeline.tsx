import React from 'react';

interface TraceStep {
  agentId: string;
  phase: string;
  content: string;
  timestamp: string;
}

interface TraceTimelineProps {
  steps: TraceStep[];
}

const TraceTimeline: React.FC<TraceTimelineProps> = ({ steps }) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
        Antigravity AI Reasoning Trace
      </h3>
      
      <div className="space-y-6 relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10"></div>
        
        {steps.map((step, idx) => (
          <div key={idx} className="relative pl-10 group">
            {/* Dot */}
            <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 z-10 
              ${step.phase === 'thought' ? 'bg-amber-400' : 
                step.phase === 'action' ? 'bg-indigo-500' : 
                step.phase === 'observation' ? 'bg-emerald-500' : 'bg-slate-400'}`} 
            />
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
                  {step.agentId} • {step.phase}
                </span>
                <span className="text-[10px] text-white/20 font-mono">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed group-hover:text-white transition-colors">
                {step.content}
              </p>
            </div>
          </div>
        ))}

        {steps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-white/20">
            <p>No active AI trace logs.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraceTimeline;
