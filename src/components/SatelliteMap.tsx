import React, { useState, useEffect, CSSProperties, useMemo } from "react";
import { SatelliteClient, Satellite } from "../lib/satellite-client";
import SatellitePopup from "./SatellitePopup";
import "./SatelliteMap.css";

const SatelliteMap: React.FC = () => {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const satelliteClient = useMemo(
    () => new SatelliteClient("https://api.murray.kiwi/satellite"),
    [],
  );
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(
    null,
  );
  const getRandomRotation = () => Math.floor(Math.random() * 360);
  const getRandomBounce = () => Math.floor(Math.random() * 10) + 1;

  useEffect(() => {
    const fetchData = async () => {
      const allSatellites = await satelliteClient.getAllSatellites();
      setSatellites(allSatellites);
    };

    fetchData();
  }, [satelliteClient]);

  const minLongitude = Math.min(...satellites.map((s) => s.longitude));
  const maxLongitude = Math.max(...satellites.map((s) => s.longitude));
  const minLatitude = Math.min(...satellites.map((s) => s.latitude));
  const maxLatitude = Math.max(...satellites.map((s) => s.latitude));

  const convertToPercentagePosition = (latitude: number, longitude: number) => {
    const longitudeRange = maxLongitude - minLongitude;
    const latitudeRange = maxLatitude - minLatitude;

    const x = ((longitude - minLongitude) / longitudeRange) * 90;
    const y = 75 - (((latitude - minLatitude) / latitudeRange) * 70); 

    console.table({x,y,longitude,latitude,minLongitude, maxLongitude, longitudeRange,  resX: (longitude - minLongitude)})

    return { x, y };
  };

  const handleSatelliteClick = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
  };

  const closePopup = () => {
    setSelectedSatellite(null);
  };

  return (
    <div className="relative w-[90vw] h-[10vh] overflow-hidden m-auto">
      {satellites.map((satellite: Satellite) => {
        const { x, y } = convertToPercentagePosition(
          satellite.latitude,
          satellite.longitude,
        );
        console.log(`Satellite ${satellite.name}: x=${x}, y=${y}`);

        const rotation = getRandomRotation();
        const bounce = getRandomBounce();
        return (
          <div
            key={satellite.name}
            className="absolute w-5 h-5 satellite"
            onClick={() => handleSatelliteClick(satellite)}
            style={
              {
                left: `${x}%`,
                top: `${y}%`,
                width: "25px",
                height: "25px",
                "--rotation": `${rotation}deg`,
                "--bounce": `${bounce}s`,
              } as CSSProperties
            }
          >
            <img src="icons/satellite.png" alt={satellite.name} />
          </div>
        );
      })}
      {selectedSatellite && (
        <SatellitePopup satellite={selectedSatellite} onClose={closePopup} />
      )}
    </div>
  );
};

export default SatelliteMap;
