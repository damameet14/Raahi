/**
 * Vehicle registration number normalization and validation for Indian plates.
 *
 * Accepts the standard format (e.g. "MH12AB1234", "DL8CAF5031") and the newer
 * Bharat (BH) series (e.g. "22BH1234AA"). Input is normalized by upper-casing
 * and stripping spaces, hyphens, and dots so that user-entered variants like
 * "mh 12 ab 1234" or "MH12-AB-1234" (the seed format) validate consistently.
 */

const STANDARD_PLATE_PATTERN = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/;
const BHARAT_SERIES_PLATE_PATTERN = /^\d{2}BH\d{4}[A-Z]{1,2}$/;

/** Upper-cases and removes spaces, hyphens, and dots. */
export function normalizeVehicleRegistrationNumber(rawValue: string): string {
  return rawValue.toUpperCase().replace(/[\s.-]/g, "");
}

/** Returns true when the normalized value is a valid Indian plate number. */
export function isValidVehicleRegistrationNumber(rawValue: string): boolean {
  const normalized = normalizeVehicleRegistrationNumber(rawValue);
  return (
    STANDARD_PLATE_PATTERN.test(normalized) ||
    BHARAT_SERIES_PLATE_PATTERN.test(normalized)
  );
}

export const VEHICLE_REGISTRATION_NUMBER_HELP =
  "Enter a valid Indian plate, e.g. MH12AB1234.";
