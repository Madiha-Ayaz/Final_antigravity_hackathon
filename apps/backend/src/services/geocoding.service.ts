import { config } from '@silentsiren/config';
import { createLogger } from '@silentsiren/logger';
import axios from 'axios';

const logger = createLogger('geocoding-service');

export class GeocodingService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = config.POSITIONSTACK_API_KEY;
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.apiKey || this.apiKey === 'YOUR_POSITIONSTACK_KEY') {
      logger.warn('PositionStack API key not configured, returning coordinates only');
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    try {
      const response = await axios.get('http://api.positionstack.com/v1/reverse', {
        params: {
          access_key: this.apiKey,
          query: `${lat},${lng}`,
          limit: 1,
        },
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const address = response.data.data[0].label;
        logger.info({ lat, lng, address }, 'Successfully resolved address');
        return address;
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error: any) {
      logger.error({ error: error.message, lat, lng }, 'Geocoding failed');
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
}

export const geocodingService = new GeocodingService();
