interface LatLng {
  latitude: number;
  longitude: number;
}

interface DirectionsResult {
  coordinates: LatLng[];
  distance: string;
  duration: string;
}

// Decode polyline format (works for both Google and OSRM which use same encoding)
function decodePolyline(encoded: string, precision: number = 5): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / factor,
      longitude: lng / factor,
    });
  }

  return points;
}

// Format distance in human readable format
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Format duration in human readable format
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours} hr ${remainingMins} min`;
}

// Use OSRM (OpenStreetMap Routing Machine) - FREE, no API key required
export async function getDirections(
  origin: LatLng,
  destination: LatLng
): Promise<DirectionsResult | null> {
  try {
    // OSRM public demo server - free to use
    // Format: /route/v1/{profile}/{coordinates}?overview=full&geometries=polyline
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM API error:', data.code, data.message);
      return null;
    }

    const route = data.routes[0];
    // OSRM uses precision 5 for polyline encoding
    const coordinates = decodePolyline(route.geometry, 5);

    return {
      coordinates,
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration),
    };
  } catch (error) {
    console.error('Failed to fetch directions:', error);
    return null;
  }
}
