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
  const getRandomAppearance = () => Math.floor(Math.random() * 10) + 5;

  useEffect(() => {
    const fetchData = async () => {
      const allSatellites = await satelliteClient.getAllSatellites();
      setSatellites(allSatellites);
    };

    fetchData();
  }, [satelliteClient]);

  const minLatitude = Math.min(...satellites.map((s) => s.latitude));
  const maxLatitude = Math.max(...satellites.map((s) => s.latitude));
  const minAltitude = Math.min(...satellites.map((s) => s.altitude));
  const maxAltitude = Math.max(...satellites.map((s) => s.altitude));

  const convertToPercentagePosition = (latitude: number, altitude: number) => {
    const latitudeRange = maxLatitude - minLatitude;
    const altitudeRange = maxAltitude - minAltitude;

    const x = ((latitude - minLatitude) / latitudeRange) * 90;
    const y = 100 - ((altitude - minAltitude) / altitudeRange) * 70 - 25;

    console.table({x: x,y: y,altitude: altitude, altitudeRange:altitudeRange,minAltitude: minAltitude, maxAltitude:maxAltitude})

    return { x, y };
  };

  return (
    <div className="relative w-[90vw] h-[10vh] overflow-hidden m-auto">
      {satellites.map((satellite: SatelliteInfo) => {
        const { x, y } = convertToPercentagePosition(
          satellite.latitude,
          satellite.altitude,
        );
        console.log(`Satellite ${satellite.name}: x=${x}, y=${y}`);

        const rotation = getRandomRotation();
        const bounce = getRandomBounce();
        const delay = getRandomAppearance();
        return (
          <SatellitePopup name={satellite.name} latitude={satellite.latitude} longitude={satellite.longitude} altitude={satellite.altitude}>
            <Satellite rotation={rotation} bounce={bounce} delay={delay} x={x} y={y} name={satellite.name}/>
          </SatellitePopup>
        );
      })}
    </div>
  );
};

export default SatelliteMap;
