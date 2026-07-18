import { describe, expect, it } from "vitest";
import { formatDistance, formatDuration } from "./routeFormatting";

describe("routeFormatting", () => {
  it("formats short distances in meters", () => {
    expect(formatDistance(850)).toBe("850 m");
  });

  it("formats longer distances in kilometers", () => {
    expect(formatDistance(12340)).toBe("12.3 km");
  });

  it("formats sub-hour durations in minutes", () => {
    expect(formatDuration(600)).toBe("10 min");
  });

  it("formats longer durations in hours and minutes", () => {
    expect(formatDuration(5400)).toBe("1 hr 30 min");
  });
});

