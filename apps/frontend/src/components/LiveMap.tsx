'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

interface LiveMapProps {
  height?: string;
  onLocationUpdate?: (lat: number, lng: number) => void;
  emergencyMode?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function LiveMap({ height = '400px', onLocationUpdate, emergencyMode = false, center, zoom }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false);

  const { position, error: gpsError, isLoading: gpsLoading, requestPosition } = useGeolocation(true);

  // Load Google Maps script dynamically
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setMapsApiLoaded(false);
      return;
    }

    if ((window as any).google?.maps) {
      setMapsApiLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
      // Script already injected, wait for it
      const check = setInterval(() => {
        if ((window as any).google?.maps) {
          setMapsApiLoaded(true);
          clearInterval(check);
        }
      }, 200);
      return () => clearInterval(check);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsApiLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Init map once API is loaded
  useEffect(() => {
    if (!mapsApiLoaded || !mapRef.current || mapLoaded) return;

    const google = (window as any).google;
    const defaultCenter = center || { lat: 31.5204, lng: 74.3587 }; // Lahore default

    const map = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: zoom || 15,
      mapTypeId: 'roadmap',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
      ],
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
    });

    // Pulsing marker
    const marker = new google.maps.Marker({
      position: defaultCenter,
      map,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: emergencyMode ? '#ef4444' : '#3b82f6',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      animation: google.maps.Animation.BOUNCE,
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    setMapLoaded(true);
  }, [mapsApiLoaded, mapLoaded, emergencyMode, center, zoom]);

  // Update map when center/zoom props change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const google = (window as any).google;
    if (center) {
      const latLng = new google.maps.LatLng(center.lat, center.lng);
      mapInstanceRef.current.panTo(latLng);
      if (markerRef.current) {
        markerRef.current.setPosition(latLng);
      }
    }
    if (zoom) {
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Update marker when GPS position changes
  useEffect(() => {
    if (!position || !mapLoaded || !mapInstanceRef.current || !markerRef.current) return;

    const google = (window as any).google;
    const latLng = new google.maps.LatLng(position.latitude, position.longitude);

    markerRef.current.setPosition(latLng);
    markerRef.current.setIcon({
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: emergencyMode ? '#ef4444' : '#3b82f6',
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    });

    mapInstanceRef.current.panTo(latLng);

    if (onLocationUpdate) {
      onLocationUpdate(position.latitude, position.longitude);
    }
  }, [position, mapLoaded, emergencyMode, onLocationUpdate]);

  // Fallback: show static map if no API key
  const hasApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  if (!hasApiKey) {
    const lat = position?.latitude ?? 31.5204;
    const lng = position?.longitude ?? 74.3587;
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-dark-700" style={{ height }}>
        {/* Embedded OpenStreetMap as free fallback */}
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Live Map"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${emergencyMode ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} />
          {position ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Getting GPS...'}
        </div>
        <div className="absolute bottom-2 right-2 bg-orange-500/90 text-white text-xs px-2 py-1 rounded">
          ⚠️ Add GOOGLE_MAPS_KEY for full map
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-dark-700" style={{ height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* GPS Status overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg ${
          emergencyMode
            ? 'bg-red-500 text-white animate-pulse'
            : position
            ? 'bg-green-500 text-white'
            : 'bg-gray-700 text-gray-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-white" />
          {emergencyMode ? '🚨 EMERGENCY MODE' : position ? '📍 GPS Live' : '⏳ Getting GPS...'}
        </div>
        {position && (
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
            {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
            {position.accuracy && ` (±${Math.round(position.accuracy)}m)`}
          </div>
        )}
      </div>

      {/* Recenter button */}
      {position && (
        <button
          onClick={() => {
            const google = (window as any).google;
            if (mapInstanceRef.current && position) {
              mapInstanceRef.current.panTo(new google.maps.LatLng(position.latitude, position.longitude));
              mapInstanceRef.current.setZoom(16);
            }
          }}
          className="absolute bottom-4 right-4 bg-white dark:bg-dark-800 shadow-lg rounded-lg px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors"
        >
          📍 Re-center
        </button>
      )}

      {gpsError && (
        <div className="absolute bottom-4 left-4 bg-red-500/90 text-white text-xs px-3 py-2 rounded-lg max-w-xs">
          GPS Error: {gpsError}
        </div>
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
          <div className="text-white text-sm flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading map...
          </div>
        </div>
      )}
    </div>
  );
}
