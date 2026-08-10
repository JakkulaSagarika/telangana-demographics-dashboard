const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

const responseJson = async (response, fallbackMessage) => {
  if (!response.ok) throw new Error(fallbackMessage);
  return response.json();
};

// Keep external provider calls in one module so OSRM/Nominatim can be replaced later.
export async function searchPlace(query) {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', countrycodes: 'in' });
  const results = await fetch(`${NOMINATIM_URL}?${params}`, { headers: { Accept: 'application/json' } }).then((response) => responseJson(response, 'Location search is currently unavailable.'));
  if (!results[0]) throw new Error(`No location found for “${query}”.`);
  return { latitude: Number(results[0].lat), longitude: Number(results[0].lon), label: results[0].display_name };
}

export async function getDrivingRoute(start, destination) {
  const coordinates = `${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}`;
  const route = await fetch(`${OSRM_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`).then((response) => responseJson(response, 'Routing service is currently unavailable.'));
  if (!route.routes?.[0]) throw new Error('No drivable route was found between these locations.');
  const result = route.routes[0];
  return { distanceKm: result.distance / 1000, durationMinutes: result.duration / 60, coordinates: result.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]) };
}
