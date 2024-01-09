import React from 'react';
import { Satellite } from '../lib/satellite-client';

type SatellitePopupProps = {
  satellite: Satellite;
  onClose: () => void;
};

const SatellitePopup: React.FC<SatellitePopupProps> = ({ satellite, onClose }) => {
  return (
    <div className="absolute bg-white p-4 shadow-lg rounded-lg">
      <button onClick={onClose}>Close</button>
      <h3>{satellite.name}</h3>
      <p>Latitude: {satellite.latitude}</p>
      <p>Longitude: {satellite.longitude}</p>
    </div>
  );
};

export default SatellitePopup;
