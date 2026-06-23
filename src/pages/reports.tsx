import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getDeliveries, getSales, getLeads } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Package, IndianRupee, Users, TrendingUp } from "lucide-react";

export default function Reports() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: () => getDeliveries(),
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => getSales(),
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => getLeads(),
  });

  const deliveryStats = {
    delivered: deliveries.filter((d: any) => d.delivery_status === "delivered").length,
    failed: deliveries.filter((d: any) => d.delivery_status === "failed").length,
    attempted: deliveries.filter((d: any) => d.delivery_status === "attempted").length,
    total: deliveries.length,
  };

  const salesTotal = sales.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
  const salesByProduct: Record<string, number> = {};
  sales.forEach((s: any) => {
    salesByProduct[s.product_name] = (salesByProduct[s.product_name] || 0) + Number(s.amount);
  });

  const leadStats = {
    new: leads.filter((l: any) => l.status === "new").length,
    contacted: leads.filter((l: any) => l.status === "contacted").length,
    converted: leads.filter((l: any) => l.status === "converted").length,
    lost: leads.filter((l: any) => l.status === "lost").length,
    total: leads.length,
  };

  const leadsByType: Record<string, number> = {};
  leads.forEach((l: any) => {
    leadsByType[l.lead_type] = (leadsByType[l.lead_type] || 0) + 1;
  });

  const conversionRate = leadStats.total > 0
    ? Math.round((leadStats.converted / leadStats.total) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Performance overview across all modules</p>
      </div>

      <Tabs defaultValue="beat" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto">
          <TabsTrigger value="beat" className="text-xs py-2" data-testid="tab-beat">Beat</TabsTrigger>
          <TabsTrigger value="delivery" className="text-xs py-2" data-testid="tab-delivery">Delivery</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs py-2" data-testid="tab-sales">Sales</TabsTrigger>
          <TabsTrigger value="leads" className="text-xs py-2" data-testid="tab-leads">Leads</TabsTrigger>
        </TabsList>

        {/* Daily Beat Report */}
        <TabsContent value="beat" className="mt-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />Daily Beat Report</h2>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Houses" value={stats?.totalHouses ?? 0} />
              <StatCard label="Total Businesses" value={stats?.totalBusinesses ?? 0} />
              <StatCard label="Today's Activity" value={stats?.todayActivity ?? 0} />
              <StatCard label="Pending Follow-ups" value={stats?.pendingFollowups ?? 0} />
            </div>
          )}
        </TabsContent>

        {/* Delivery Performance */}
        <TabsContent value="delivery" className="mt-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-primary" />Delivery Performance</h2>
          {deliveriesLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total" value={deliveryStats.total} />
                <StatCard label="Delivered" value={deliveryStats.delivered} color="green" />
                <StatCard label="Failed" value={deliveryStats.failed} color="red" />
                <StatCard label="Attempted" value={deliveryStats.attempted} color="yellow" />
              </div>
              {deliveryStats.total > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Success Rate</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-green-500">
                        {Math.round((deliveryStats.delivered / deliveryStats.total) * 100)}%
                      </span>
                      <span className="text-muted-foreground text-sm pb-1">delivery rate</span>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(deliveryStats.delivered / deliveryStats.total) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Sales Report */}
        <TabsContent value="sales" className="mt-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><IndianRupee className="w-4 h-4 text-primary" />Sales Report</h2>
          {salesLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    ₹{salesTotal.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{sales.length} transactions</p>
                </CardContent>
              </Card>
              {Object.keys(salesByProduct).length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">By Product</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(salesByProduct)
                      .sort(([, a], [, b]) => b - a)
                      .map(([product, amount]) => (
                        <div key={product} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                          <span className="text-sm font-medium" data-testid={`product-${product}`}>{product}</span>
                          <span className="text-sm text-primary font-semibold">₹{amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Lead Conversion Report */}
        <TabsContent value="leads" className="mt-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Lead Conversion</h2>
          {leadsLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Leads" value={leadStats.total} />
                <StatCard label="Converted" value={leadStats.converted} color="green" />
                <StatCard label="In Progress" value={leadStats.contacted} color="yellow" />
                <StatCard label="Lost" value={leadStats.lost} color="red" />
              </div>
              {leadStats.total > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-3xl font-bold text-green-500">{conversionRate}%</p>
                  </CardContent>
                </Card>
              )}
              {Object.keys(leadsByType).length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">By Lead Type</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(leadsByType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <span className="text-sm font-medium">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: "green" | "red" | "yellow" }) {
  const colorClass = color === "green" ? "text-green-500" : color === "red" ? "text-destructive" : color === "yellow" ? "text-yellow-500" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value.toLocaleString("en-IN")}</p>
      </CardContent>
    </Card>
  );
}
