import { useState, useEffect, useRef } from "react";
import { useAreas, useHouses, useBusinesses } from "@/hooks/useQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Home, Building2, MapPin, LayoutList, Layers, Navigation, Search } from "lucide-react";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

// Fix Leaflet default icons broken by Vite asset hashing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function makeIcon(type: "house" | "business" | "user") {
  const color = type === "house" ? "#10b981" : type === "business" ? "#f59e0b" : "#3b82f6";
  const emoji = type === "house" ? "🏠" : type === "business" ? "🏢" : "📍";
  return L.divIcon({
    html: `<div style="width:34px;height:34px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.4)">${emoji}</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom, { animate: true }); }, [center, zoom, map]);
  return null;
}

export default function BeatMap() {
  const { data: areas, isLoading: loadingAreas } = useAreas();
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.076, 72.877]);
  const [mapZoom, setMapZoom] = useState(13);

  const { data: houses,     isLoading: loadingH } = useHouses(selectedAreaId ?? "");
  const { data: businesses, isLoading: loadingB } = useBusinesses(selectedAreaId ?? "");

  const gpsHouses     = houses?.filter(h => h.latitude && h.longitude) ?? [];
  const gpsBusinesses = businesses?.filter(b => b.latitude && b.longitude) ?? [];

  const filteredHouses = gpsHouses.filter(h =>
    !search ||
    h.head_of_family.toLowerCase().includes(search.toLowerCase()) ||
    h.house_number.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  );
  const filteredBusinesses = gpsBusinesses.filter(b =>
    !search ||
    b.business_name.toLowerCase().includes(search.toLowerCase()) ||
    b.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  const locateUser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const coord: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserPos(coord);
      setMapCenter(coord);
      setMapZoom(16);
    });
  };

  // Auto-center on first GPS point when area changes
  useEffect(() => {
    if (gpsHouses.length > 0) {
      setMapCenter([Number(gpsHouses[0].latitude), Number(gpsHouses[0].longitude)]);
      setMapZoom(15);
    } else if (gpsBusinesses.length > 0) {
      setMapCenter([Number(gpsBusinesses[0].latitude), Number(gpsBusinesses[0].longitude)]);
      setMapZoom(15);
    }
  }, [selectedAreaId, houses, businesses]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beat Map</h1>
          <p className="text-muted-foreground text-sm">Visualise and manage areas, houses, and businesses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={locateUser} className="gap-1.5">
            <Navigation className="w-4 h-4" /> My Location
          </Button>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              <LayoutList className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === "map" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              <Layers className="w-4 h-4" /> Map
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Areas sidebar */}
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-2">
            <Map className="w-4 h-4" /> Areas
          </h2>
          {loadingAreas ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
          ) : areas?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No areas found.</p>
          ) : (
            areas?.map(area => (
              <Card
                key={area.id}
                onClick={() => setSelectedAreaId(area.id === selectedAreaId ? null : area.id)}
                className={`cursor-pointer transition-all ${
                  selectedAreaId === area.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "hover:border-primary/40"
                }`}
              >
                <CardContent className="p-3">
                  <div className="font-medium">{area.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Beat {area.beat_number}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main content */}
        <div className="md:col-span-2 space-y-3">
          {!selectedAreaId ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-muted-foreground">
              <MapPin className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Select an area to view its data</p>
            </div>
          ) : (
            <>
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, number, or address…"
                  className="pl-9"
                />
              </div>

              {/* Map View */}
              {viewMode === "map" && (
                <div className="rounded-xl overflow-hidden border border-border" style={{ height: 380 }}>
                  {(loadingH || loadingB) ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : (
                    <MapContainer
                      center={mapCenter}
                      zoom={mapZoom}
                      style={{ height: "100%", width: "100%" }}
                      zoomControl={true}
                    >
                      <RecenterMap center={mapCenter} zoom={mapZoom} />
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        maxZoom={19}
                      />

                      {/* User location */}
                      {userPos && (
                        <>
                          <Marker position={userPos} icon={makeIcon("user")}>
                            <Popup><strong>📍 Your Location</strong></Popup>
                          </Marker>
                          <Circle center={userPos} radius={40}
                            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.12 }} />
                        </>
                      )}

                      {/* Houses cluster */}
                      <MarkerClusterGroup chunkedLoading>
                        {filteredHouses.map(h => (
                          <Marker
                            key={h.id}
                            position={[Number(h.latitude), Number(h.longitude)]}
                            icon={makeIcon("house")}
                          >
                            <Popup>
                              <div className="text-sm space-y-0.5 min-w-[160px]">
                                <div className="font-bold">{h.head_of_family}</div>
                                <div className="text-gray-500">🏠 {h.house_number}</div>
                                <div className="text-gray-500 text-xs">{h.address}</div>
                                {h.mobile && (
                                  <a href={`tel:${h.mobile}`} className="text-blue-600 text-xs">{h.mobile}</a>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MarkerClusterGroup>

                      {/* Businesses cluster */}
                      <MarkerClusterGroup chunkedLoading>
                        {filteredBusinesses.map(b => (
                          <Marker
                            key={b.id}
                            position={[Number(b.latitude), Number(b.longitude)]}
                            icon={makeIcon("business")}
                          >
                            <Popup>
                              <div className="text-sm space-y-0.5 min-w-[160px]">
                                <div className="font-bold">{b.business_name}</div>
                                <div className="text-gray-500">{b.owner_name} • {b.category}</div>
                                <div className="text-gray-500 text-xs">{b.address}</div>
                                {b.mobile && (
                                  <a href={`tel:${b.mobile}`} className="text-blue-600 text-xs">{b.mobile}</a>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MarkerClusterGroup>
                    </MapContainer>
                  )}
                </div>
              )}

              {/* Legend for map view */}
              {viewMode === "map" && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Houses ({filteredHouses.length})</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Businesses ({filteredBusinesses.length})</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> You</span>
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <Tabs defaultValue="houses">
                  <TabsList className="w-full">
                    <TabsTrigger value="houses" className="flex-1">
                      <Home className="w-4 h-4 mr-1.5" /> Houses ({houses?.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="businesses" className="flex-1">
                      <Building2 className="w-4 h-4 mr-1.5" /> Businesses ({businesses?.length ?? 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="houses" className="mt-3 space-y-2 max-h-96 overflow-y-auto pr-1">
                    {loadingH ? (
                      Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                    ) : houses?.filter(h =>
                        !search ||
                        h.head_of_family.toLowerCase().includes(search.toLowerCase()) ||
                        h.house_number.toLowerCase().includes(search.toLowerCase()) ||
                        h.address.toLowerCase().includes(search.toLowerCase())
                      ).map(h => (
                      <div key={h.id} className="p-3 border border-border rounded-lg bg-background flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{h.head_of_family}</div>
                          <div className="text-xs text-muted-foreground">🏠 {h.house_number}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{h.address}</div>
                          {h.mobile && <div className="text-xs text-primary mt-0.5">{h.mobile}</div>}
                        </div>
                        {h.latitude && h.longitude && (
                          <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                            <MapPin className="w-2.5 h-2.5" /> GPS
                          </Badge>
                        )}
                      </div>
                    ))}
                    {houses?.length === 0 && <p className="text-sm text-muted-foreground">No houses in this area.</p>}
                  </TabsContent>

                  <TabsContent value="businesses" className="mt-3 space-y-2 max-h-96 overflow-y-auto pr-1">
                    {loadingB ? (
                      Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                    ) : businesses?.filter(b =>
                        !search ||
                        b.business_name.toLowerCase().includes(search.toLowerCase()) ||
                        b.owner_name.toLowerCase().includes(search.toLowerCase()) ||
                        b.address.toLowerCase().includes(search.toLowerCase())
                      ).map(b => (
                      <div key={b.id} className="p-3 border border-border rounded-lg bg-background flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{b.business_name}</div>
                          <div className="text-xs text-muted-foreground">{b.owner_name} • {b.category}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{b.address}</div>
                          {b.mobile && <div className="text-xs text-primary mt-0.5">{b.mobile}</div>}
                        </div>
                        {b.latitude && b.longitude && (
                          <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                            <MapPin className="w-2.5 h-2.5" /> GPS
                          </Badge>
                        )}
                      </div>
                    ))}
                    {businesses?.length === 0 && <p className="text-sm text-muted-foreground">No businesses in this area.</p>}
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
