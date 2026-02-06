"use client";

import { MapPin, Navigation } from "lucide-react";

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

function buildStaticMapUrl(
  userLoc: UserLocation,
  theaters: Theater[],
): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const userLat = userLoc.lat;
  const userLng = userLoc.lng;
  if (!userLat || !userLng) return null;

  const params = new URLSearchParams({
    size: "400x250",
    scale: "2",
    maptype: "roadmap",
    language: "ja",
    key,
  });

  // ユーザー位置マーカー (青)
  params.append(
    "markers",
    `color:blue|label:H|${userLat},${userLng}`,
  );

  // 映画館マーカー (赤)
  const theaterMarkers = theaters
    .slice(0, 8)
    .map((t) => `${t.lat},${t.lng}`)
    .join("|");
  if (theaterMarkers) {
    params.append("markers", `color:red|size:small|${theaterMarkers}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function TheaterMap({
  userLocation,
  theaters,
}: {
  userLocation: UserLocation;
  theaters: Theater[];
}) {
  const mapUrl = buildStaticMapUrl(userLocation, theaters);
  const addressText = `${userLocation.prefecture}${userLocation.city}${userLocation.street}`;

  return (
    <div className="rounded-xl bg-white border border-neutral-200/60 shadow-sm overflow-hidden animate-fade-in-up">
      {/* マップ画像 */}
      {mapUrl && (
        <img
          src={mapUrl}
          alt="映画館マップ"
          className="w-full h-auto"
          width={400}
          height={250}
        />
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
