import React from 'react';

interface Resource {
  id: string;
  type: string;
  status: string;
  distanceKm: number;
  estimatedArrivalMin: number;
}

interface ResourceCardsProps {
  resources: Resource[];
}

const ResourceCards: React.FC<ResourceCardsProps> = ({ resources }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Allocated Resources</h4>
      {resources.map((res) => (
        <div key={res.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              {res.type === 'ambulance' ? '🚑' : res.type === 'police' ? '🚔' : '🚒'}
            </div>
            <div>
              <p className="text-sm font-bold text-white capitalize">{res.type}</p>
              <p className="text-[10px] text-white/40 font-mono">{res.id}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs font-bold text-emerald-400">{res.estimatedArrivalMin} mins</p>
            <p className="text-[10px] text-white/40">{res.distanceKm} km away</p>
          </div>
        </div>
      ))}

      {resources.length === 0 && (
        <p className="text-sm text-white/20 italic">Awaiting AI allocation...</p>
      )}
    </div>
  );
};

export default ResourceCards;
