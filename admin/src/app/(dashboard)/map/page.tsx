'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Bike, RefreshCw, MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import L from 'leaflet';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Custom marker icons
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">${emoji}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

export default function MapPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'stores' | 'riders'>('all');

  const storeIcon = useMemo(() => createCustomIcon('#8B5CF6', '🏪'), []);
  const riderAvailableIcon = useMemo(() => createCustomIcon('#10B981', '🏍️'), []);
  const riderBusyIcon = useMemo(() => createCustomIcon('#F97316', '🏍️'), []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['map-data'],
    queryFn: adminApi.getMapData,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Default center: Lekki, Lagos
  const center: [number, number] = [6.4355, 3.4723];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Live Map View</h1>
          <p className="text-gray-500">Real-time tracking of stores and riders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('stores')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedType === 'stores' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stores
            </button>
            <button
              onClick={() => setSelectedType('riders')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedType === 'riders' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Riders
            </button>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Store className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stores on Map</p>
              <p className="text-xl font-bold">{data?.stores?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Bike className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Riders</p>
              <p className="text-xl font-bold">{data?.riders?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Live Map</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !isClient ? (
            <Skeleton className="h-[500px] w-full rounded-lg" />
          ) : (
            <div className="h-[500px] w-full rounded-lg overflow-hidden">
              <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                crossOrigin=""
              />
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                
                {/* Store Markers */}
                {(selectedType === 'all' || selectedType === 'stores') && data?.stores?.map((store: any) => (
                  store.latitude && store.longitude && (
                    <Marker
                      key={`store-${store.id}`}
                      position={[store.latitude, store.longitude]}
                      icon={storeIcon}
                    >
                      <Popup>
                        <div className="p-3 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Store className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{store.name}</h3>
                              <Badge className={store.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {store.isOpen ? '● Open' : '○ Closed'}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{store.latitude?.toFixed(4)}, {store.longitude?.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}

                {/* Rider Markers */}
                {(selectedType === 'all' || selectedType === 'riders') && data?.riders?.map((rider: any) => (
                  rider.currentLatitude && rider.currentLongitude && (
                    <Marker
                      key={`rider-${rider.id}`}
                      position={[rider.currentLatitude, rider.currentLongitude]}
                      icon={rider.isBusy ? riderBusyIcon : riderAvailableIcon}
                    >
                      <Popup>
                        <div className="p-3 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Bike className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{rider.user?.name}</h3>
                              {rider.isBusy ? (
                                <Badge className="bg-orange-100 text-orange-800">
                                  ● On Delivery
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">
                                  ● Available
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{rider.user?.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{rider.currentLatitude?.toFixed(4)}, {rider.currentLongitude?.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-lg">🏪</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Stores</span>
                  <p className="text-xs text-gray-500">{data?.stores?.length || 0} locations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg">🏍️</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Riders</span>
                  <p className="text-xs text-gray-500">{data?.riders?.length || 0} active</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Auto-refresh every 30s</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
