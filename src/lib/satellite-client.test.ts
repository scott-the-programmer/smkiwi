import { SatelliteClient } from "./satellite-client";
import { describe, it, expect, vi } from "vitest";

describe("SatelliteClient", () => {
  it("fetches and combines satellite data correctly", async () => {
    global.fetch = vi.fn((endpoint) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { name: "Test Satellite", latitude: 0, longitude: 0 },
          ]),
      }),
    ) as jest.Mock;

    const client = new SatelliteClient("http://localhost");
    const satellites = await client.getSatellites();

    expect(satellites.length).toBeGreaterThan(0);
    expect(satellites[0].name).toBe("Test Satellite");
  });
});
