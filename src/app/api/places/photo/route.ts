import { NextRequest } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name");
  const maxWidthPx = searchParams.get("maxWidthPx") ?? "400";

  if (!name) {
    return new Response(JSON.stringify({ error: "name is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Google Places Photo API (New): GET https://places.googleapis.com/v1/{name}/media
  const url = new URL(
    `https://places.googleapis.com/v1/${name}/media`,
  );
  url.searchParams.set("maxWidthPx", maxWidthPx);
  url.searchParams.set("skipHttpRedirect", "true");
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: `Places Photo API error: ${res.status}` }),
      { status: res.status, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = (await res.json()) as { photoUri?: string };
  if (!data.photoUri) {
    return new Response(
      JSON.stringify({ error: "No photoUri returned" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  // 画像を取得してプロキシ
  const imageRes = await fetch(data.photoUri);
  if (!imageRes.ok) {
    return new Response(
      JSON.stringify({ error: `Image fetch failed: ${imageRes.status}` }),
      { status: imageRes.status, headers: { "Content-Type": "application/json" } },
    );
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
  const imageBuffer = await imageRes.arrayBuffer();

  return new Response(imageBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
