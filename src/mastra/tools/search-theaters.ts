import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

const theaterSchema = z.object({
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  placeId: z.string(),
  chain: z.enum(["toho", "aeon", "cinema109", "other"]),
});

export const searchTheaters = createTool({
  id: "search-theaters",
  description:
    "指定された緯度経度の周辺にある映画館を Google Maps Places API (New) で検索します。チェーン名（TOHO、イオンシネマ、109シネマズ等）を自動判定します。",
  inputSchema: z.object({
    lat: z.number().describe("検索中心の緯度"),
    lng: z.number().describe("検索中心の経度"),
    radiusKm: z
      .number()
      .optional()
      .default(10)
      .describe("検索半径 (km)。デフォルト 10km"),
  }),
  outputSchema: z.object({
    theaters: z.array(theaterSchema),
  }),
  execute: async ({ lat, lng, radiusKm }) => {
    const radiusMeters = (radiusKm ?? 10) * 1000;

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.location,places.id",
        },
        body: JSON.stringify({
          includedTypes: ["movie_theater"],
          maxResultCount: 8,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: radiusMeters,
            },
          },
          languageCode: "ja",
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Places API error (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as {
      places?: Array<{
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        id?: string;
      }>;
    };

    const places = data.places ?? [];

    const theaters = places.map((place) => {
      const name = place.displayName?.text ?? "";
      return {
        name,
        address: place.formattedAddress ?? "",
        lat: place.location?.latitude ?? 0,
        lng: place.location?.longitude ?? 0,
        placeId: place.id ?? "",
        chain: detectChain(name),
      };
    });

    return { theaters };
  },
});

function detectChain(
  name: string,
): "toho" | "aeon" | "cinema109" | "other" {
  if (name.includes("TOHO") || name.includes("TOHOシネマズ")) {
    return "toho";
  }
  if (name.includes("イオンシネマ")) {
    return "aeon";
  }
  if (name.includes("109シネマズ")) {
    return "cinema109";
  }
  return "other";
}
