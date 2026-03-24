import { NextRequest, NextResponse } from "next/server";
import type { AddressSuggestion } from "@/types";

// Mapbox Geocoding API — server-side only; secret token never sent to the client
const MAPBOX_TOKEN = process.env.MAPBOX_SECRET_TOKEN;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: "Geocoding service not configured" },
      { status: 503 }
    );
  }

  const url = new URL("https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURIComponent(q) + ".json");
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("country", "us");
  url.searchParams.set("types", "place,locality,neighborhood,address,poi");
  url.searchParams.set("limit", "5");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { "User-Agent": "FillRight/1.0 (getfillright.com)" },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return NextResponse.json({ error: "Geocoding request timed out" }, { status: 504 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "Geocoding service error" }, { status: 502 });
  }

  const data = await response.json() as { features?: MapboxFeature[] };

  const suggestions: AddressSuggestion[] = (data.features ?? []).map((feature) => ({
    id: feature.id,
    displayName: feature.text,
    fullAddress: feature.place_name,
    coordinates: {
      lng: feature.center[0],
      lat: feature.center[1],
    },
  }));

  return NextResponse.json({ suggestions });
}

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}
