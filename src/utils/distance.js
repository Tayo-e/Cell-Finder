export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg) { return deg * (Math.PI / 180); }

export function getNearest(cells, userLat, userLng, count = 3) {
  return cells
    .map((cell) => ({
      ...cell,
      distanceKm: getDistanceKm(userLat, userLng, cell.lat, cell.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function googleMapsUrl(lat, lng, address) {
  const dest = lat && lng ? `${lat},${lng}` : encodeURIComponent(address);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}
