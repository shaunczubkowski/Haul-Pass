import { NextRequest, NextResponse } from "next/server";
import type { RouteAlternative } from "@/types";

const MAPBOX_TOKEN = process.env.MAPBOX_SECRET_TOKEN;

export async function GET(request: NextRequest) {
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: "Routing service not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");
  const destLat = searchParams.get("destLat");
  const destLng = searchParams.get("destLng");

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json(
      { error: "Missing required parameters: originLat, originLng, destLat, destLng" },
      { status: 400 }
    );
  }

  const lat1 = parseFloat(originLat);
  const lng1 = parseFloat(originLng);
  const lat2 = parseFloat(destLat);
  const lng2 = parseFloat(destLng);

  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    return NextResponse.json(
      { error: "Coordinates must be valid numbers" },
      { status: 400 }
    );
  }

  const directionsUrl = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${lng1},${lat1};${lng2},${lat2}`
  );
  directionsUrl.searchParams.set("access_token", MAPBOX_TOKEN);
  directionsUrl.searchParams.set("alternatives", "true");
  directionsUrl.searchParams.set("geometries", "geojson");
  // overview=false: skip full geometry — we only need distance/duration/summary
  directionsUrl.searchParams.set("overview", "false");

  let directionsResponse: Response;
  try {
    directionsResponse = await fetch(directionsUrl.toString(), {
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return NextResponse.json(
      { error: "Route fetch timed out" },
      { status: 504 }
    );
  }

  if (!directionsResponse.ok) {
    return NextResponse.json(
      { error: "Routing service error" },
      { status: 502 }
    );
  }

  const data = await directionsResponse.json() as MapboxDirectionsResponse;

  if (!data.routes?.length) {
    return NextResponse.json(
      { error: "No route found between these locations" },
      { status: 422 }
    );
  }

  const alternatives: RouteAlternative[] = data.routes.map((route, index) => {
    const rawSummary = route.legs?.[0]?.summary ?? "";
    const label = rawSummary ? `via ${rawSummary}` : `Route ${index + 1}`;
    return {
      index,
      distanceMiles: Math.round((route.distance / 1609.344) * 10) / 10,
      durationMinutes: Math.round(route.duration / 60),
      label,
    };
  });

  return NextResponse.json({ alternatives });
}

interface MapboxDirectionsResponse {
  routes?: Array<{
    distance: number;   // meters
    duration: number;   // seconds
    legs?: Array<{
      summary?: string; // e.g. "I-80 E, I-76 E"
    }>;
  }>;
}
