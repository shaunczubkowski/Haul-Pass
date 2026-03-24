import type { RouteWaypoint } from "@/types";

const EARTH_RADIUS_MILES = 3958.8;

/**
 * Haversine formula: great-circle distance between two [lng, lat] points in miles.
 */
export function haversineDistanceMiles(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

/**
 * Sample waypoints from a route geometry at the given interval in miles.
 *
 * @param coordinates - Array of [lng, lat] pairs from a decoded route polyline
 * @param intervalMiles - How often to place a waypoint (default 180 miles)
 * @returns Array of RouteWaypoint (without locationLabel — caller sets that)
 */
export function sampleWaypoints(
  coordinates: [number, number][],
  intervalMiles: number
): Omit<RouteWaypoint, "locationLabel">[] {
  if (coordinates.length < 2) return [];

  const waypoints: Omit<RouteWaypoint, "locationLabel">[] = [];
  let accumulatedMiles = 0;
  let totalMiles = 0;
  let nextThreshold = intervalMiles;

  for (let i = 1; i < coordinates.length; i++) {
    const segmentMiles = haversineDistanceMiles(coordinates[i - 1], coordinates[i]);
    accumulatedMiles += segmentMiles;
    totalMiles += segmentMiles;

    if (accumulatedMiles >= nextThreshold) {
      const [lng, lat] = coordinates[i];
      waypoints.push({ lat, lng, milesFromOrigin: Math.round(totalMiles) });
      nextThreshold += intervalMiles;
    }
  }

  return waypoints;
}

/**
 * Compute total route distance in miles from a coordinate array.
 */
export function totalRouteMiles(coordinates: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineDistanceMiles(coordinates[i - 1], coordinates[i]);
  }
  return Math.round(total);
}

/**
 * Generate a Google Maps deep-link to search for gas stations near a coordinate.
 * Respects the user's mapsApp preference from localStorage.
 */
export function gasStationMapsUrl(
  lat: number,
  lng: number,
  fuelType: "regular" | "diesel",
  mapsApp: "google" | "apple"
): string {
  const query = fuelType === "diesel" ? "diesel+gas+stations" : "gas+stations";
  if (mapsApp === "apple") {
    return `https://maps.apple.com/?q=${query}&sll=${lat},${lng}&z=14`;
  }
  return `https://www.google.com/maps/search/${query}/@${lat},${lng},14z`;
}
