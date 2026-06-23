import { useAreas, useHouses, useBusinesses } from "@/hooks/useQueries";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Home, Building2, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function BeatMap() {
  const { data: areas, isLoading: loadingAreas } = useAreas();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  if (loadingAreas) {
    return <div className="p-4"><Skeleton className="h-64 rounded-xl w-full" /></div>;
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Beat Map</h1>
        <p className="text-muted-foreground text-sm">Manage areas, houses, and businesses.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Map className="w-5 h-5"/> Areas</h2>
          {areas?.map(area => (
            <Card 
              key={area.id} 
              className={`cursor-pointer transition-colors ${selectedArea === area.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedArea(area.id)}
            >
              <CardContent className="p-4">
                <div className="font-medium text-lg">{area.name}</div>
                <div className="text-sm text-muted-foreground">Beat: {area.beat_number}</div>
              </CardContent>
            </Card>
          ))}
          {areas?.length === 0 && <div className="text-muted-foreground text-sm">No areas found.</div>}
        </div>

        <div className="md:col-span-2">
          {selectedArea ? (
            <AreaDetails areaId={selectedArea} />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-muted-foreground">
              <MapPin className="w-12 h-12 mb-4 opacity-20" />
              <p>Select an area to view houses and businesses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AreaDetails({ areaId }: { areaId: string }) {
  const { data: houses, isLoading: loadingHouses } = useHouses(areaId);
  const { data: businesses, isLoading: loadingBusinesses } = useBusinesses(areaId);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle>Area Details</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="houses" className="w-full">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 flex justify-start">
            <TabsTrigger value="houses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6">Houses ({houses?.length || 0})</TabsTrigger>
            <TabsTrigger value="businesses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6">Businesses ({businesses?.length || 0})</TabsTrigger>
          </TabsList>
          <div className="p-4">
            <TabsContent value="houses" className="mt-0 space-y-3">
              {loadingHouses ? <Skeleton className="h-20 w-full" /> : 
                houses?.map(h => (
                  <div key={h.id} className="p-3 border border-border rounded-lg bg-background flex justify-between items-start">
                    <div>
                      <div className="font-semibold flex items-center gap-2"><Home className="w-4 h-4 text-muted-foreground"/> {h.house_number}</div>
                      <div className="text-sm text-muted-foreground">{h.head_of_family}</div>
                      <div className="text-xs text-muted-foreground mt-1">{h.address}</div>
                    </div>
                    {h.latitude && h.longitude && <Badge variant="outline" className="text-[10px]"><MapPin className="w-3 h-3 mr-1" /> GPS Logged</Badge>}
                  </div>
                ))
              }
              {houses?.length === 0 && <div className="text-sm text-muted-foreground">No houses recorded in this area.</div>}
            </TabsContent>
            <TabsContent value="businesses" className="mt-0 space-y-3">
              {loadingBusinesses ? <Skeleton className="h-20 w-full" /> : 
                businesses?.map(b => (
                  <div key={b.id} className="p-3 border border-border rounded-lg bg-background flex justify-between items-start">
                    <div>
                      <div className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground"/> {b.business_name}</div>
                      <div className="text-sm text-muted-foreground">{b.owner_name} • {b.category}</div>
                      <div className="text-xs text-muted-foreground mt-1">{b.address}</div>
                    </div>
                    {b.latitude && b.longitude && <Badge variant="outline" className="text-[10px]"><MapPin className="w-3 h-3 mr-1" /> GPS Logged</Badge>}
                  </div>
                ))
              }
              {businesses?.length === 0 && <div className="text-sm text-muted-foreground">No businesses recorded in this area.</div>}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
