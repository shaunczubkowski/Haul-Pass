type ValidateResult = { ok: true } | { ok: false; error: string };

/**
 * Validates gasPricePerGallon from API request bodies.
 * The field is optional — `undefined` is always valid.
 * If present, it must be a finite number greater than 0.
 */
export function validateGasPrice(value: unknown): ValidateResult {
  if (value === undefined) return { ok: true };
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "gasPricePerGallon must be a positive number" };
  }
  return { ok: true };
}
