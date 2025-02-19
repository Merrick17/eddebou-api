import { Injectable, Logger } from '@nestjs/common';
import { DeliveryLocation } from '../schemas/delivery.schema';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async getCoordinatesFromLocation(location: DeliveryLocation): Promise<[number, number]> {
    const addressString = `${location.address}, ${location.city}, ${location.state} ${location.postalCode}, ${location.country}`;
    // Implementation would go here - for now returning mock coordinates
    return [0, 0]; // Replace with actual geocoding implementation
  }

  async getAddressFromCoordinates(coordinates: [number, number]): Promise<string> {
    // Implementation would go here - for now returning mock address
    return 'Mock Address'; // Replace with actual reverse geocoding implementation
  }

  async getCoordinatesFromAddress(location: DeliveryLocation): Promise<[number, number]> {
    try {
      const address = `${location.address}, ${location.city}, ${location.state} ${location.postalCode}, ${location.country}`;
      const encodedAddress = encodeURIComponent(address);
      
      // Using OpenStreetMap Nominatim API (free and doesn't require API key)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`,
        {
          headers: {
            'User-Agent': 'Eddebou-API/1.0'
          }
        }
      );

      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return [parseFloat(lat), parseFloat(lon)];
      }

      this.logger.warn(`No coordinates found for address: ${address}`);
      return [0, 0]; // Default coordinates if geocoding fails
    } catch (error) {
      this.logger.error(`Error geocoding address: ${error.message}`);
      return [0, 0]; // Default coordinates if geocoding fails
    }
  }
} 