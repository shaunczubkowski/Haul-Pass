import { NextRequest, NextResponse } from "next/server";
import { calculateRouteLeg, calculateStopInterval } from "@/lib/calculator";
import { sampleWaypoints, totalRouteMiles, gasStationMapsUrl } from "@/lib/routeSampling";
import { getTruckById } from "@/data/trucks";
import { GAUGE_LEVELS, LOAD_LEVEL_CONFIG } from "@/types";
import { RISK_TOLERANCE_BUFFERS } from "@/lib/calculator";
import type { PlannedRoute, RouteStop, AddressSuggestion } from "@/types";

const MAPBOX_TOKEN = process.env.MAPBOX_SECRET_TOKEN;

export async function POST(request: NextRequest) {
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: "Routing service not configured" },
      { status: 503 }
    );
  }

  let body: RoutePlanRequest;
  try {
    body = await request.json() as RoutePlanRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { originId, destinationId, originCoords, destinationCoords, originName, destinationName, truckId, riskTolerance, loadLevel, gasPricePerGallon, mapsApp, routeIndex } = body;

  if (!originCoords || !destinationCoords || !truckId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate coordinate ranges at the boundary before touching Mapbox
  const coordsInRange = (c: { lat: number; lng: number }) =>
    typeof c.lat === "number" && typeof c.lng === "number" &&
    c.lat >= -90 && c.lat <= 90 && c.lng >= -180 && c.lng <= 180;

  if (!coordsInRange(originCoords) || !coordsInRange(destinationCoords)) {
    return NextResponse.json(
      { error: "Coordinates out of range (lat: −90–90, lng: −180–180)" },
      { status: 400 }
    );
  }

  const truck = getTruckById(truckId);
  if (!truck) {
    return NextResponse.json({ error: "Unknown truck" }, { status: 400 });
  }

  // Fetch route from Mapbox Directions API
  const directionsUrl = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destinationCoords.lng},${destinationCoords.lat}`
  );
  directionsUrl.searchParams.set("access_token", MAPBOX_TOKEN);
  directionsUrl.searchParams.set("alternatives", "true");
  directionsUrl.searchParams.set("geometries", "geojson");
  directionsUrl.searchParams.set("overview", "full");

  let directionsResponse: Response;
  try {
    directionsResponse = await fetch(directionsUrl.toString(), {
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return NextResponse.json({ error: "Route fetch timed out" }, { status: 504 });
  }

  if (!directionsResponse.ok) {
    return NextResponse.json({ error: "Routing service error" }, { status: 502 });
  }

  const directionsData = await directionsResponse.json() as MapboxDirectionsResponse;
  const routeCount = directionsData.routes?.length ?? 0;
  if (routeCount === 0) {
    return NextResponse.json({ error: "No route found between these locations" }, { status: 422 });
  }

  // If the caller provided a routeIndex, validate it is within bounds.
  // An out-of-range index means the alternatives listing diverged from this
  // call (extremely unlikely but worth an explicit error over a silent fallback).
  const resolvedIndex = routeIndex ?? 0;
  if (resolvedIndex < 0 || resolvedIndex >= routeCount) {
    return NextResponse.json(
      { error: "Selected route is no longer available — please re-plan your route" },
      { status: 422 }
    );
  }

  const route = directionsData.routes[resolvedIndex];

  const coordinates = route.geometry.coordinates as [number, number][];
  const totalMiles = totalRouteMiles(coordinates);

  // Resolve settings — needed for both stop placement and per-leg fuel calculations
  const resolvedRiskTolerance = riskTolerance ?? "standard";
  const resolvedLoadLevel = loadLevel ?? "empty";
  const safetyBuffer = RISK_TOLERANCE_BUFFERS[resolvedRiskTolerance];
  const mpgMultiplier = LOAD_LEVEL_CONFIG[resolvedLoadLevel].mpgMultiplier;

  // Sample waypoints along the route at an interval derived from the truck,
  // load, and risk tolerance so that conservative/loaded routes get more stops
  const stopInterval = calculateStopInterval(truck, mpgMultiplier, resolvedRiskTolerance);
  const sampledWaypoints = sampleWaypoints(coordinates, stopInterval);

  // Add location labels (city/state approximation from coordinates)
  // In Phase 2 this will use reverse geocoding; for now use a placeholder
  const waypointsWithLabels = sampledWaypoints.map((wp) => ({
    ...wp,
    locationLabel: `${wp.milesFromOrigin} miles from start`,
  }));
  const preferredMapsApp = mapsApp === "apple" ? "apple" : "google";

  const stops: RouteStop[] = [];
  let totalGallons = 0;
  let totalCost: number | null = gasPricePerGallon ? 0 : null;

  for (let i = 0; i < waypointsWithLabels.length; i++) {
    const wp = waypointsWithLabels[i];
    const prevMiles = i === 0 ? 0 : waypointsWithLabels[i - 1].milesFromOrigin;
    const legMiles = wp.milesFromOrigin - prevMiles;

    // Intermediate stops fill to FULL; final stop fills to contractPickupLevel
    // For the route planner we always target FULL at intermediate stops
    // (the "return fuel" calculation is a separate concern handled by the main calculator)
    const legResult = calculateRouteLeg({
      truck,
      mpgMultiplier,
      safetyBuffer,
      legDistanceMiles: legMiles,
      startingFuelFraction: GAUGE_LEVELS.FULL,
      targetFuelFraction: GAUGE_LEVELS.FULL,
      gasPricePerGallon,
    });

    const mapsUrl = gasStationMapsUrl(wp.lat, wp.lng, truck.fuelType, preferredMapsApp);

    totalGallons += legResult.gallonsToAdd;
    if (totalCost !== null && legResult.estimatedCost !== null) {
      totalCost += legResult.estimatedCost;
    }

    stops.push({
      stopNumber: i + 1,
      waypoint: wp,
      milesFromPreviousStop: legMiles,
      station: {
        name: null,
        address: null,
        coordinates: { lat: wp.lat, lng: wp.lng },
        mapsUrl,
      },
      fuelCalculation: {
        gallonsToAdd: legResult.gallonsToAdd,
        estimatedCost: legResult.estimatedCost,
        isAtRisk: legResult.isAtRisk,
        fuelType: truck.fuelType,
      },
    });
  }

  const origin: AddressSuggestion = {
    id: originId ?? "origin",
    displayName: originName ?? "Starting point",
    fullAddress: originName ?? "Starting point",
    coordinates: originCoords,
  };

  const destination: AddressSuggestion = {
    id: destinationId ?? "destination",
    displayName: destinationName ?? "Destination",
    fullAddress: destinationName ?? "Destination",
    coordinates: destinationCoords,
  };

  const plannedRoute: PlannedRoute = {
    origin,
    destination,
    totalMiles,
    totalStops: stops.length,
    estimatedTotalGallons: Math.round(totalGallons * 10) / 10,
    estimatedTotalCost: totalCost !== null ? Math.round(totalCost * 100) / 100 : null,
    stops,
    truck,
    riskTolerance: riskTolerance ?? "standard",
    loadLevel: loadLevel ?? "empty",
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(plannedRoute);
}

interface Coords {
  lat: number;
  lng: number;
}

interface RoutePlanRequest {
  originId?: string;
  destinationId?: string;
  originCoords: Coords;
  destinationCoords: Coords;
  originName?: string;
  destinationName?: string;
  truckId: string;
  riskTolerance?: "conservative" | "standard" | "lean";
  loadLevel?: "empty" | "partial" | "full";
  gasPricePerGallon?: number;
  mapsApp?: "google" | "apple";
  routeIndex?: number;
}

interface MapboxDirectionsResponse {
  routes?: Array<{
    geometry: {
      coordinates: number[][];
    };
    distance: number;
    duration: number;
  }>;
}
