import { MAPBOX_ACCESS_TOKEN } from '../constants/config';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface DirectionsResult {
  coordinates: LatLng[];
  distance: string;
  duration: string;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ${minutes % 60} min`;
}

export async function getDirections(
  origin: LatLng,
  destination: LatLng,
): Promise<DirectionsResult | null> {
  try {
    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
      `?access_token=${MAPBOX_ACCESS_TOKEN}` +
      `&geometries=geojson` +
      `&overview=full` +
      `&steps=false`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('Mapbox Directions: no routes returned', data.message);
      return null;
    }

    const route = data.routes[0];
    // Mapbox returns GeoJSON [lng, lat] pairs — convert to {latitude, longitude}
    const coordinates: LatLng[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }),
    );

    return {
      coordinates,
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration),
    };
  } catch (error) {
    console.error('Mapbox Directions error:', error);
    return null;
  }
}
