'use client';

import { useState, useEffect } from 'react';

interface CarrierSelectorProps {
  value?: string;
  onChange: (carrier: string) => void;
  required?: boolean;
}

interface Carrier {
  id: string;
  name: string;
  country: string;
}

const CARRIERS: Carrier[] = [
  // Pakistan
  { id: 'jazz', name: 'Jazz', country: 'Pakistan' },
  { id: 'telenor', name: 'Telenor', country: 'Pakistan' },
  { id: 'zong', name: 'Zong', country: 'Pakistan' },
  { id: 'ufone', name: 'Ufone', country: 'Pakistan' },

  // USA
  { id: 'verizon', name: 'Verizon', country: 'USA' },
  { id: 'att', name: 'AT&T', country: 'USA' },
  { id: 'tmobile', name: 'T-Mobile', country: 'USA' },
  { id: 'sprint', name: 'Sprint', country: 'USA' },

  // India
  { id: 'airtel', name: 'Airtel', country: 'India' },
  { id: 'vodafone', name: 'Vodafone', country: 'India' },
  { id: 'jio', name: 'Jio', country: 'India' },

  // UK
  { id: 'o2', name: 'O2', country: 'UK' },
  { id: 'vodafone_uk', name: 'Vodafone UK', country: 'UK' },
  { id: 'three', name: 'Three', country: 'UK' },
];

export function CarrierSelector({ value, onChange, required = false }: CarrierSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>('Pakistan');
  const [filteredCarriers, setFilteredCarriers] = useState<Carrier[]>([]);

  useEffect(() => {
    const carriers = CARRIERS.filter((c) => c.country === selectedCountry);
    setFilteredCarriers(carriers);
  }, [selectedCountry]);

  const countries = Array.from(new Set(CARRIERS.map((c) => c.country)));

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mobile Carrier {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select carrier...</option>
          {filteredCarriers.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Required for free SMS delivery via email gateway
        </p>
      </div>
    </div>
  );
}
