import React from "react";
import { SatelliteInfo } from "../lib/satellite-client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../shadcn/ui/drawer";
import { Button } from "../shadcn/ui/button";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";

type SatellitePopupProps = {
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  children: React.ReactNode;
};

const SatellitePopup: React.FC<SatellitePopupProps> = ({
  name,
  latitude,
  longitude,
  altitude,
  children,
}) => {
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
              <div className="table-cell w-1/2 align-top pt-5">
                <DrawerDescription>Type: Weather Station</DrawerDescription>
                <DrawerDescription>Latitude: {latitude}</DrawerDescription>
                <DrawerDescription>Longitude: {longitude}</DrawerDescription>
                <DrawerDescription>Altitude: {altitude}km</DrawerDescription>
                <DrawerDescription>Age: {"something"}</DrawerDescription>
              </div>
              <div className="table-cell w-1/2">
                <img
                  src="icons/satellite.png"
                  className="w-2/3 mx-auto my-auto align-top"
                  alt={name}
                />
              </div>
            </div>
          </div>
          <DrawerFooter>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SatellitePopup;
