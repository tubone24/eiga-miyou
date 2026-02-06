import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export const getDirections = createTool({
  id: "get-directions",
  description:
    "Google Maps Directions API を使って2地点間の移動時間・距離を計算します。交通手段は transit（公共交通機関）、driving（車）、walking（徒歩）から選択できます。",
  inputSchema: z.object({
    originLat: z.number().describe("出発地の緯度"),
    originLng: z.number().describe("出発地の経度"),
    destLat: z.number().describe("目的地の緯度"),
    destLng: z.number().describe("目的地の経度"),
    mode: z
      .enum(["driving", "transit", "walking"])
      .optional()
      .default("transit")
      .describe("移動手段。デフォルトは transit（公共交通機関）"),
  }),
  outputSchema: z.object({
    durationMinutes: z.number(),
    distanceMeters: z.number(),
    summary: z.string(),
  }),
  execute: async ({ originLat, originLng, destLat, destLng, mode }) => {
    const requestedMode = mode ?? "transit";

    const fetchDirections = async (travelMode: string) => {
      const params = new URLSearchParams({
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        mode: travelMode,
        key: GOOGLE_MAPS_API_KEY,
        language: "ja",
      });

      // transit モードでは departure_time を明示的に指定
      if (travelMode === "transit") {
        params.set("departure_time", "now");
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Directions API error (${response.status}): ${errorBody}`,
        );
      }

      return (await response.json()) as {
        status: string;
        routes?: Array<{
          summary?: string;
          legs?: Array<{
            duration?: { value?: number; text?: string };
            distance?: { value?: number; text?: string };
          }>;
        }>;
      };
    };

    let data = await fetchDirections(requestedMode);

    // transit で ZERO_RESULTS の場合、driving にフォールバック
    if (
      requestedMode === "transit" &&
      (data.status === "ZERO_RESULTS" || !data.routes?.length)
    ) {
      console.warn(
        `[getDirections] transit で結果なし (origin: ${originLat},${originLng} → dest: ${destLat},${destLng})。driving にフォールバックします。`,
      );
      data = await fetchDirections("driving");
    }

    if (data.status !== "OK" || !data.routes?.length) {
      throw new Error(
        `Directions API returned status: ${data.status}. ルートが見つかりませんでした。(mode: ${requestedMode})`,
      );
    }

    const leg = data.routes[0].legs?.[0];

    if (!leg) {
      throw new Error("ルート情報の取得に失敗しました。");
    }

    const durationSeconds = leg.duration?.value ?? 0;
    const distanceMeters = leg.distance?.value ?? 0;
    const summary = data.routes[0].summary ?? "";

    return {
      durationMinutes: Math.round(durationSeconds / 60),
      distanceMeters,
      summary,
    };
  },
});
