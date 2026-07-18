import { describe, expect, it } from "vitest";
import type { RouteCalculationResult } from "../../types/google-maps/routeSummary";
import {
  deleteCachedRouteCalculationResult,
  getCachedRouteCalculationResult,
  setCachedRouteCalculationResult,
} from "./routeCalculationCache";

describe("routeCalculationCache", () => {
  it("stores and deletes route calculation results by cache key", () => {
    const result: RouteCalculationResult = {
      cacheKey: "cache-key",
      routeStatus: "ready",
      routes: [],
      selectedRouteId: null,
    };

    setCachedRouteCalculationResult(result);

    expect(getCachedRouteCalculationResult("cache-key")).toEqual(result);

    deleteCachedRouteCalculationResult("cache-key");

    expect(getCachedRouteCalculationResult("cache-key")).toBeNull();
  });
});
