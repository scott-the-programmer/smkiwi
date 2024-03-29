import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../shadcn/ui/drawer";
import { SatelliteType } from "../lib/satellite-client";

type SatellitePopupProps = {
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  birthday: Date;
  type: SatelliteType;
  children: React.ReactNode;
};

const SatellitePopup: React.FC<SatellitePopupProps> = ({
  name,
  latitude,
  longitude,
  altitude,
  birthday,
  type,
  children,
}) => {
  const age = calculateAge(birthday);
  let readableType = "";
  switch (type) {
    case SatelliteType.WeatherStation:
      readableType = "Weather Station";
      break;
    default:
      readableType = type[0].toUpperCase() + type.slice(1);
  }

  return (
    <Drawer>
      <DrawerTrigger>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-center">{name}</DrawerTitle>
          </DrawerHeader>
          <div className="table">
            <div className="table-row mx-auto my-auto">
              <div className="table-cell w-1/2 align-top pt-5 text-center">
                <DrawerDescription>Type: {readableType}</DrawerDescription>
                <DrawerDescription>Latitude: {latitude}</DrawerDescription>
                <DrawerDescription>Longitude: {longitude}</DrawerDescription>
                <DrawerDescription>Altitude: {altitude}km</DrawerDescription>
                <DrawerDescription>Age: {age}</DrawerDescription>
              </div>
              <div className="table-cell w-1/2">
                <img
                  src="icons/satellite-dark.png"
                  className="w-2/3 mx-auto my-auto align-top"
                  alt={name}
                />
              </div>
            </div>
          </div>
          <DrawerFooter></DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

function calculateAge(birthDate: Date): string {
  const now = new Date();
  let monthsOld = (now.getFullYear() - birthDate.getFullYear()) * 12;
  monthsOld -= birthDate.getMonth();
  monthsOld += now.getMonth();

  if (monthsOld < 0) monthsOld = 0;

  const yearsOld = Math.floor(monthsOld / 12);
  const partialMonths = monthsOld % 12;

  return yearsOld > 0
    ? `${yearsOld} years and ${partialMonths} months`
    : `${partialMonths} months`;
}

export default SatellitePopup;
