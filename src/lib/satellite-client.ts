export type SatelliteInfo = {
  name: string;
  latitude: number;
  longitude: number;
  age: Date;
  altitude: number;
};

export class SatelliteClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchSatellites(endpoint: string): Promise<SatelliteInfo[]> {
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

  async getAllSatellites(): Promise<SatelliteInfo[]> {
    const endpoints = ['weatherstations'];
    const promises = endpoints.map(endpoint => this.fetchSatellites(endpoint));
    const results = await Promise.all(promises);
    console.log(results)
    return results.flat();
  }
}
