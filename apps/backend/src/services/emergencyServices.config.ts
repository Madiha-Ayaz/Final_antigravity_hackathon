import { config } from '@silentsiren/config';

export interface EmergencyService {
  name: string;
  type: 'ambulance' | 'police' | 'fire';
  phoneNumber: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

class EmergencyServicesConfig {
  private services: EmergencyService[] = [];

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Ambulance Service
    this.services.push({
      name: 'Emergency Ambulance',
      type: 'ambulance',
      phoneNumber: config.EMERGENCY_AMBULANCE_NUMBER || '911',
      location:
        config.EMERGENCY_AMBULANCE_LAT && config.EMERGENCY_AMBULANCE_LNG
          ? {
              latitude: parseFloat(config.EMERGENCY_AMBULANCE_LAT),
              longitude: parseFloat(config.EMERGENCY_AMBULANCE_LNG),
            }
          : undefined,
    });

    // Police Service
    this.services.push({
      name: 'Emergency Police',
      type: 'police',
      phoneNumber: config.EMERGENCY_POLICE_NUMBER || '911',
      location:
        config.EMERGENCY_POLICE_LAT && config.EMERGENCY_POLICE_LNG
          ? {
              latitude: parseFloat(config.EMERGENCY_POLICE_LAT),
              longitude: parseFloat(config.EMERGENCY_POLICE_LNG),
            }
          : undefined,
    });

    // Fire Service
    this.services.push({
      name: 'Emergency Fire Department',
      type: 'fire',
      phoneNumber: config.EMERGENCY_FIRE_NUMBER || '911',
    });
  }

  getService(type: 'ambulance' | 'police' | 'fire'): EmergencyService | undefined {
    return this.services.find((s) => s.type === type);
  }

  getAllServices(): EmergencyService[] {
    return this.services;
  }

  getServicePhoneNumber(type: 'ambulance' | 'police' | 'fire'): string {
    const service = this.getService(type);
    return service?.phoneNumber || '911';
  }

  getServiceLocation(
    type: 'ambulance' | 'police' | 'fire'
  ): { latitude: number; longitude: number } | undefined {
    const service = this.getService(type);
    return service?.location;
  }

  calculateDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number {
    // Haversine formula to calculate distance in kilometers
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.latitude - from.latitude);
    const dLon = this.toRad(to.longitude - from.longitude);
    const lat1 = this.toRad(from.latitude);
    const lat2 = this.toRad(to.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getNearestService(
    userLocation: { latitude: number; longitude: number },
    type: 'ambulance' | 'police' | 'fire'
  ): { service: EmergencyService; distance?: number } | undefined {
    const service = this.getService(type);
    if (!service) return undefined;

    if (service.location) {
      const distance = this.calculateDistance(userLocation, service.location);
      return { service, distance };
    }

    return { service };
  }
}

export const emergencyServicesConfig = new EmergencyServicesConfig();
