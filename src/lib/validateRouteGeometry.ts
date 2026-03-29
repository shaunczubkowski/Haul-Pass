type ValidateResult = { ok: true } | { ok: false; error: string };

/**
 * Validates client-supplied routeGeometry coordinate arrays.
 * The field is optional — `undefined` is always valid.
 * If present, requires at least 2 coordinate pairs, each with
 * a finite lng in [-180, 180] and a finite lat in [-90, 90].
 */
export function validateRouteGeometry(
  geometry: [number, number][] | undefined
): ValidateResult {
  if (geometry === undefined) return { ok: true };
  if (geometry.length < 2) {
    return { ok: false, error: "routeGeometry must contain at least 2 coordinate pairs" };
  }
  const allInRange = geometry.every(
    ([lng, lat]) =>
      typeof lng === "number" && typeof lat === "number" &&
      Number.isFinite(lng) && Number.isFinite(lat) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
  if (!allInRange) {
    return { ok: false, error: "routeGeometry contains out-of-range coordinates" };
  }
  return { ok: true };
}
