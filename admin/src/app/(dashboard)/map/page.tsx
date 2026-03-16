'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Bike, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';

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

export default function MapPage() {
  const [isClient, setIsClient] = useState(false);

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
          <h1 className="text-2xl font-semibold text-gray-900">Map View</h1>
          <p className="text-gray-500">Live view of stores and riders</p>
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
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Store Markers */}
                {data?.stores?.map((store: any) => (
                  store.latitude && store.longitude && (
                    <Marker
                      key={`store-${store.id}`}
                      position={[store.latitude, store.longitude]}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Store className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold">{store.name}</span>
                          </div>
                          <Badge className={store.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {store.isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}

                {/* Rider Markers */}
                {data?.riders?.map((rider: any) => (
                  rider.currentLatitude && rider.currentLongitude && (
                    <Marker
                      key={`rider-${rider.id}`}
                      position={[rider.currentLatitude, rider.currentLongitude]}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Bike className="h-4 w-4 text-green-600" />
                            <span className="font-semibold">{rider.user?.name}</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Available
                          </Badge>
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-600">Stores</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">Riders</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
