export type Satellite = {
  name: string;
  latitude: number;
  longitude: number;
  relativeX: number;
  relativeY: number;
};

export class SatelliteClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchSatellites(endpoint: string): Promise<Satellite[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`);
      if (!response.ok) {
        throw new Error(`Error fetching ${endpoint}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
    }
  }

  async getAllSatellites(): Promise<Satellite[]> {
    const endpoints = ['weatherstations'];
    const promises = endpoints.map(endpoint => this.fetchSatellites(endpoint));
    const results = await Promise.all(promises);
    console.log(results)
    return results.flat();
  }
}
