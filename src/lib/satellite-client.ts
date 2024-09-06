export type SatelliteInfo = {
  name: string;
  latitude: number;
  longitude: number;
  age: Date;
  altitude: number;
  type: SatelliteType;
};

export enum SatelliteType {
  WeatherStation = "weatherstation",
  ISS = "iss",
  Iridium = "iridium",
  Starlink = "starlink",
  TV = "tv",
  Brightest = "brightest",
  Celestis = "celestis",
  Experimental = "experimental",
  DisasterMonitoring = "disaster-monitoring",
}

export class SatelliteClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchSatellites(type: string): Promise<SatelliteInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${type}`);
      if (!response.ok) {
        throw new Error(`Error fetching ${type}: ${response.statusText}`);
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
          type: type as SatelliteType,
        });
      });

      return typedResponse;
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      return [];
    }
  }

  async getSatellites(): Promise<SatelliteInfo[]> {
    const types = [
      SatelliteType.WeatherStation,
      SatelliteType.ISS,
      SatelliteType.Iridium,
      SatelliteType.Starlink,
      SatelliteType.TV,
      SatelliteType.Brightest,
      SatelliteType.Celestis,
      SatelliteType.Experimental,
      SatelliteType.DisasterMonitoring,
    ];
    const promises = types.map((endpoint) =>
      this.fetchSatellites(endpoint),
    );
    const results = await Promise.all(promises);
    return results.flat();
  }
}
