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
      const satellites = await response.json();
      const typedResponse: SatelliteInfo[] = [];
      satellites.forEach((s: any) => {
        typedResponse.push({
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          age: new Date(s.age),
          altitude: s.altitude,
        });
      });

      return typedResponse;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
    }
  }

  async getSatellites(): Promise<SatelliteInfo[]> {
    const endpoints = [
      "weatherstations",
      "iss",
      "iridiums",
      "starlinks",
      "tv",
      "brightest",
      "celestis",
    ];
    const promises = endpoints.map((endpoint) =>
      this.fetchSatellites(endpoint),
    );
    const results = await Promise.all(promises);
    return results.flat();
  }
}
