import { useState, useCallback, useEffect, useRef } from 'react';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface GeolocationState {
  position: GPSPosition | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation(watchContinuous = false) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false,
  });
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      position: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      },
      error: null,
      isLoading: false,
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error: err.message,
      isLoading: false,
    }));
  }, []);

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation not supported', isLoading: false }));
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });
  }, [handleSuccess, handleError]);

  // Continuous GPS watching
  useEffect(() => {
    if (!watchContinuous) return;
    if (!navigator.geolocation) return;

    setState((prev) => ({ ...prev, isLoading: true }));
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [watchContinuous, handleSuccess, handleError]);

  return {
    ...state,
    requestPosition,
  };
}
