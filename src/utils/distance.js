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

// put these helpers in distance.js
function tieKey(userLat, userLng, cellId) {
  // deterministic string based on user location + cell id
  const s = `${userLat.toFixed(4)},${userLng.toFixed(4)}|${cellId}`;
  // simple 32-bit hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getNearest(cells, userLat, userLng, count = 3) {
  return cells
    .map((cell) => ({
      ...cell,
      distanceKm: getDistanceKm(userLat, userLng, cell.lat, cell.lng),
      _tie: tieKey(userLat, userLng, cell.id),
    }))
    .sort((a, b) => (a.distanceKm - b.distanceKm) || (a._tie - b._tie))
    .slice(0, count);
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function googleMapsUrl(lat, lng, address) {
  const hasAddress = typeof address === "string" && address.trim().length > 0;
  const destination = hasAddress ? address.trim() : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}