import { CSSProperties, MouseEventHandler } from "react";
import "./Satellite.css";

interface SatelliteProps {
  rotation: number;
  bounce: number;
  delay: number;
  x: number;
  y: number;
  name: string;
}

const Satellite: React.FC<SatelliteProps> = ({
  rotation,
  bounce,
  delay,
  x,
  y,
  name,
}) => {
  return (
    <div
      key={name}
      className="absolute w-5 h-5 satellite"
      style={
        {
          left: `${x}%`,
          top: `${y}%`,
          width: "30px",
          height: "30px",
          "--rotation": `${rotation}deg`,
          "--bounce": `${bounce}s`,
          "--delay": `${delay}s`,
        } as CSSProperties
      }
    >
      <img src="icons/satellite.png" alt={name} />
    </div>
  );
};

export default Satellite;
