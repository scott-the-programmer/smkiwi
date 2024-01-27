import React, { useState, useEffect, useMemo } from "react";
import { SatelliteClient, SatelliteInfo } from "../lib/satellite-client";
import SatellitePopup from "./SatellitePopup";
import Satellite from "./Satellite";

const SatelliteMap: React.FC = () => {
  const [satellites, setSatellites] = useState<SatelliteInfo[]>([]);
  const satelliteClient = useMemo(
    () => new SatelliteClient("https://api.murray.kiwi/satellite"),
    [],
  );
  const getRandomRotation = () => Math.floor(Math.random() * 360);
  const getRandomBounce = () => Math.floor(Math.random() * 10) + 1;
  const getRandomAppearance = () => Math.floor(Math.random() * 4);

  useEffect(() => {
    const fetchData = async () => {
      const allSatellites = await satelliteClient.getSatellites();
      setSatellites(allSatellites);
    };

    fetchData();
  }, [satelliteClient]);

  const minLongitude = Math.min(...satellites.map((s) => s.longitude));
  const maxLongitude = Math.max(...satellites.map((s) => s.longitude));
  const minAltitude = Math.min(...satellites.map((s) => s.altitude));
  const maxAltitude = Math.max(...satellites.map((s) => s.altitude));

  const convertToPercentagePosition = (longitude: number, altitude: number) => {
    const longitudeRange = maxLongitude - minLongitude;
    const altitudeRange = maxAltitude - minAltitude;

    const x = ((longitude - minLongitude) / longitudeRange) * 90;
    const y = 100 - ((altitude - minAltitude) / altitudeRange) * 70 - 25;

    return { x, y };
  };

  return (
    <div className="w-[90vw] h-[20vh] overflow-hidden m-auto absolute">
      {satellites.map((satellite: SatelliteInfo) => {
        const { x, y } = convertToPercentagePosition(
          satellite.longitude,
          satellite.altitude,
        );

        const rotation = getRandomRotation();
        const bounce = getRandomBounce();
        const delay = getRandomAppearance();


        return (
          <SatellitePopup
            name={satellite.name}
            latitude={satellite.latitude}
            longitude={satellite.longitude}
            altitude={satellite.altitude}
            birthday={satellite.age}
            type={satellite.type}
          >
            <Satellite
              rotation={rotation}
              bounce={bounce}
              delay={delay}
              x={x}
              y={y}
              name={satellite.name}
            />
          </SatellitePopup>
        );
      })}
    </div>
  );
};

export default SatelliteMap;
