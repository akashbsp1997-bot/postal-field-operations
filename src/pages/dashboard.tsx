import { useDashboardStats } from "@/hooks/useQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Home, Building2, TrendingUp, Users, CalendarCheck, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">Real-time metrics for today's beat operations.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <QuickActionLink href="/delivery" icon={Package} label="Scan Art" />
        <QuickActionLink href="/sales" icon={TrendingUp} label="Log Sale" />
        <QuickActionLink href="/leads" icon={Users} label="Add Lead" />
        <QuickActionLink href="/beat-map" icon={Home} label="Map" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Pending Deliveries" 
          value={stats?.pendingDeliveries ?? 0} 
          icon={Package} 
          trend={`${stats?.totalDeliveries ?? 0} total today`}
          highlight={true}
        />
        <StatCard 
          title="Today's Sales" 
          value={`₹${(stats?.totalSales ?? 0).toLocaleString('en-IN')}`} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Beat Houses" 
          value={stats?.totalHouses ?? 0} 
          icon={Home} 
        />
        <StatCard 
          title="Beat Businesses" 
          value={stats?.totalBusinesses ?? 0} 
          icon={Building2} 
        />
        <StatCard 
          title="Follow-ups" 
          value={stats?.pendingFollowups ?? 0} 
          icon={CalendarCheck} 
        />
        <StatCard 
          title="Activities Logged" 
          value={stats?.todayActivity ?? 0} 
          icon={CheckCircle2} 
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, highlight }: { title: string, value: string | number, icon: any, trend?: string, highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className={`text-2xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}

function QuickActionLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center p-3 md:p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent transition-all group">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  );
}
