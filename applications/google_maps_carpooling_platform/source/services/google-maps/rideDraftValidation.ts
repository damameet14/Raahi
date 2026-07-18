import type {
  RideDraft,
  RideDraftInput,
  RideValidationResult,
} from "../../types/google-maps/rideDraft";

const MAX_PASSENGER_COUNT = 6;

export function validateRideDraftInput({
  destination,
  passengerCount,
  pickup,
  route,
  vehicleSelectionPlaceholder,
}: RideDraftInput): RideValidationResult {
  const errorMessages: string[] = [];

  if (!pickup) {
    errorMessages.push("Choose a pickup location.");
  }

  if (!destination) {
    errorMessages.push("Choose a destination.");
  }

  if (!route) {
    errorMessages.push("Calculate a route before creating a ride draft.");
  }

  if (!Number.isInteger(passengerCount) || passengerCount < 1) {
    errorMessages.push("Passenger count must be at least 1.");
  }

  if (passengerCount > MAX_PASSENGER_COUNT) {
    errorMessages.push("Passenger count cannot exceed 6.");
  }

  if (!vehicleSelectionPlaceholder) {
    errorMessages.push("Choose a vehicle option.");
  }

  return {
    errorMessages,
    isValid: errorMessages.length === 0,
  };
}

export function createRideDraftFromInput(input: RideDraftInput): RideDraft {
  const validationResult = validateRideDraftInput(input);

  if (
    !validationResult.isValid ||
    !input.destination ||
    !input.pickup ||
    !input.route
  ) {
    throw new Error(validationResult.errorMessages[0]);
  }

  return {
    createdAtIsoString: new Date().toISOString(),
    destination: input.destination,
    passengerCount: input.passengerCount,
    pickup: input.pickup,
    rideDraftId: `ride-draft-${Date.now()}`,
    route: input.route,
    vehicleSelectionPlaceholder: input.vehicleSelectionPlaceholder,
  };
}
