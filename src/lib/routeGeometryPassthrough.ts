/**
 * Selects the route coordinates to use for stop planning.
 *
 * If the client passed back `routeGeometry` from /api/route-alternatives,
 * that geometry is used directly — no second Mapbox call needed and route
 * consistency is guaranteed (#99).
 *
 * Falls back to the Mapbox routes array when geometry is absent or too short.
 * Returns null if neither source can provide valid coordinates.
 */
export function selectRouteCoordinates(
  routeGeometry: [number, number][] | undefined,
  mapboxRoutes: Array<{ geometry: { coordinates: [number, number][] } }> | null,
  routeIndex: number
): [number, number][] | null {
  if (routeGeometry && routeGeometry.length >= 2) {
    return routeGeometry;
  }
  if (!mapboxRoutes || routeIndex < 0 || routeIndex >= mapboxRoutes.length) {
    return null;
  }
  return mapboxRoutes[routeIndex].geometry.coordinates;
}
