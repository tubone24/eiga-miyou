"use client";

import { useState, useEffect, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  Pin,
} from "@vis.gl/react-google-maps";
import { MapPin, Navigation, Home } from "lucide-react";

export interface UserLocation {
  label: string;
  prefecture: string;
  city: string;
  street: string;
  lat?: number;
  lng?: number;
}

export interface Theater {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  chain: string;
}

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

function FitBounds({
  userLocation,
  theaters,
}: {
  userLocation: UserLocation;
  theaters: Theater[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (!userLocation.lat || !userLocation.lng) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
    theaters.forEach((t) => {
      bounds.extend({ lat: t.lat, lng: t.lng });
    });
    map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
  }, [map, userLocation, theaters]);

  return null;
}

function TheaterMarker({
  theater,
  onClick,
}: {
  theater: Theater;
  onClick: () => void;
}) {
  return (
    <AdvancedMarker
      position={{ lat: theater.lat, lng: theater.lng }}
      onClick={onClick}
      title={theater.name}
    >
      <Pin background="#ef4444" borderColor="#dc2626" glyphColor="#fff" />
    </AdvancedMarker>
  );
}

function InteractiveMap({
  userLocation,
  theaters,
}: {
  userLocation: UserLocation;
  theaters: Theater[];
}) {
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);

  const handleClose = useCallback(() => setSelectedTheater(null), []);

  const defaultCenter = userLocation.lat && userLocation.lng
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: 35.6762, lng: 139.6503 };

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={13}
      mapId={MAP_ID}
      style={{ height: "250px", width: "100%" }}
      gestureHandling="cooperative"
      disableDefaultUI
      zoomControl
    >
      <FitBounds userLocation={userLocation} theaters={theaters} />

      {/* ユーザー位置マーカー（青） */}
      {userLocation.lat && userLocation.lng && (
        <AdvancedMarker
          position={{ lat: userLocation.lat, lng: userLocation.lng }}
          title="自宅"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-md">
            <Home className="h-3.5 w-3.5 text-white" />
          </div>
        </AdvancedMarker>
      )}

      {/* 映画館マーカー（赤） */}
      {theaters.slice(0, 8).map((t) => (
        <TheaterMarker
          key={t.placeId}
          theater={t}
          onClick={() => setSelectedTheater(t)}
        />
      ))}

      {/* InfoWindow */}
      {selectedTheater && (
        <InfoWindow
          position={{ lat: selectedTheater.lat, lng: selectedTheater.lng }}
          onClose={handleClose}
          headerContent={selectedTheater.name}
        >
          <p className="text-xs text-neutral-600 max-w-[200px]">
            {selectedTheater.address}
          </p>
        </InfoWindow>
      )}
    </Map>
  );
}

export function TheaterMap({
  userLocation,
  theaters,
}: {
  userLocation: UserLocation;
  theaters: Theater[];
}) {
  const addressText = `${userLocation.prefecture}${userLocation.city}${userLocation.street}`;

  return (
    <div className="rounded-xl bg-white border border-neutral-200/60 shadow-sm overflow-hidden animate-fade-in-up">
      {/* インタラクティブマップ */}
      {API_KEY && (
        <APIProvider apiKey={API_KEY}>
          <InteractiveMap
            userLocation={userLocation}
            theaters={theaters}
          />
        </APIProvider>
      )}

      <div className="p-4 space-y-3">
        {/* ユーザー住所 */}
        <div className="flex items-start gap-2 text-sm">
          <Navigation className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-neutral-500 text-xs">自宅</span>
            <p className="text-neutral-700">{addressText}</p>
          </div>
        </div>

        {/* 映画館リスト */}
        <div className="space-y-1.5">
          {theaters.slice(0, 5).map((t) => (
            <div key={t.placeId} className="flex items-start gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-neutral-800 font-medium text-xs truncate">
                  {t.name}
                </p>
                <p className="text-neutral-400 text-[11px] truncate">
                  {t.address}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
