"use client";

import { Star, UtensilsCrossed } from "lucide-react";
import type { RestaurantData } from "@/types/schedule-card";

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: "無料",
  PRICE_LEVEL_INEXPENSIVE: "¥",
  PRICE_LEVEL_MODERATE: "¥¥",
  PRICE_LEVEL_EXPENSIVE: "¥¥¥",
  PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥¥",
};

function RestaurantPhoto({
  photoName,
  alt,
}: {
  photoName: string | null;
  alt: string;
}) {
  if (!photoName) {
    return (
      <div className="w-20 h-20 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
        <UtensilsCrossed className="h-5 w-5 text-neutral-300" />
      </div>
    );
  }

  const src = `/api/places/photo?name=${encodeURIComponent(photoName)}&maxWidthPx=160`;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-20 h-20 rounded-lg object-cover shrink-0 bg-neutral-100"
    />
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-xs text-neutral-600">
      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
      {rating.toFixed(1)}
    </span>
  );
}

export function RestaurantCards({ data }: { data: RestaurantData }) {
  if (data.restaurants.length === 0) return null;

  const heading =
    data.mealType === "lunch" ? "ランチの提案" : "ディナーの提案";

  return (
    <div className="rounded-xl bg-white border border-neutral-200/60 shadow-sm overflow-hidden animate-fade-in-up">
      <div className="px-4 pt-3 pb-2">
        <h3 className="font-serif text-sm font-semibold text-neutral-800 tracking-tight">
          {heading}
        </h3>
      </div>

      <div className="px-4 pb-3">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {data.restaurants.map((r) => {
            const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${r.placeId}`;

            return (
              <a
                key={r.placeId}
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors shrink-0 min-w-[280px] max-w-[320px]"
              >
                <RestaurantPhoto photoName={r.photoName} alt={r.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {r.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {r.rating != null && <RatingStars rating={r.rating} />}
                    {r.priceLevel && (
                      <span className="text-xs text-neutral-500">
                        {PRICE_LABELS[r.priceLevel] ?? r.priceLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                    {r.address}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
