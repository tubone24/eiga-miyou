import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

const restaurantSchema = z.object({
  name: z.string(),
  address: z.string(),
  rating: z.number().nullable(),
  priceLevel: z.string().nullable(),
  types: z.array(z.string()),
  placeId: z.string(),
  photoName: z.string().nullable(),
});

export const searchRestaurants = createTool({
  id: "search-restaurants",
  description:
    "指定された緯度経度の周辺にあるレストランを Google Maps Places API (New) で検索します。食事タイプ（ランチ・ディナー）に応じた説明をエージェントに提供します。",
  inputSchema: z.object({
    lat: z.number().describe("検索中心の緯度"),
    lng: z.number().describe("検索中心の経度"),
    radiusKm: z
      .number()
      .optional()
      .default(1)
      .describe("検索半径 (km)。デフォルト 1km"),
    mealType: z
      .enum(["lunch", "dinner"])
      .describe("食事タイプ: lunch または dinner"),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("最大取得件数。デフォルト 5"),
  }),
  outputSchema: z.object({
    restaurants: z.array(restaurantSchema),
    mealType: z.enum(["lunch", "dinner"]),
  }),
  execute: async ({ lat, lng, radiusKm, mealType, maxResults }) => {
    const radiusMeters = (radiusKm ?? 1) * 1000;
    const resultCount = Math.min(maxResults ?? 5, 20);

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.id,places.photos",
        },
        body: JSON.stringify({
          includedTypes: ["restaurant"],
          maxResultCount: resultCount,
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
        rating?: number;
        priceLevel?: string;
        types?: string[];
        id?: string;
        photos?: Array<{ name?: string }>;
      }>;
    };

    const places = data.places ?? [];

    const restaurants = places.map((place) => ({
      name: place.displayName?.text ?? "",
      address: place.formattedAddress ?? "",
      rating: place.rating ?? null,
      priceLevel: place.priceLevel ?? null,
      types: place.types ?? [],
      placeId: place.id ?? "",
      photoName: place.photos?.[0]?.name ?? null,
    }));

    return {
      restaurants,
      mealType,
    };
  },
});
