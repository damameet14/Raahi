export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.max(1, Math.round((durationSeconds % 3600) / 60));

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours} hr ${minutes} min`;
}

