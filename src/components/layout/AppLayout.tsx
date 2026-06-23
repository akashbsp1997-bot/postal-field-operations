import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@/context/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { 
  LayoutDashboard, Map, Package, Users, 
  IndianRupee, MoreHorizontal, LogOut, 
  Settings, FileText, ShieldAlert, WifiOff
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/beat-map", label: "Beat Map", icon: Map },
  { href: "/delivery", label: "Delivery", icon: Package },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/sales", label: "Sales", icon: IndianRupee },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const [, setLocation] = useLocation();
  const isOnline = useOnlineStatus();

  // Handle dark mode default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  if (loading || !user) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary">Loading...</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span className="font-bold text-lg tracking-tight">Tensa Postal Beat</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <DesktopNavLink key={item.href} {...item} />
          ))}
          <div className="pt-4 mt-4 border-t border-border">
            <DesktopNavLink href="/followups" label="Follow-ups" icon={FileText} />
            <DesktopNavLink href="/reports" label="Reports" icon={LayoutDashboard} />
            {(user.role === "admin" || user.role === "inspector" || user.role === "supervisor") && (
              <DesktopNavLink href="/admin" label="Admin Panel" icon={ShieldAlert} />
            )}
            <DesktopNavLink href="/settings" label="Settings" icon={Settings} />
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 md:pb-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span className="font-bold text-lg">Tensa Beat</span>
          </div>
          <div className="hidden md:flex font-medium">Field Operations</div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-green-500" : "bg-destructive animate-pulse")} />
              <span className="text-xs text-muted-foreground hidden sm:inline-block">
                {isOnline ? "Online" : "Offline Mode"}
              </span>
            </div>
            <Avatar className="w-8 h-8 border border-border">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">{user.name.slice(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-destructive/10 text-destructive text-xs font-medium px-4 py-1.5 flex items-center justify-center gap-2 border-b border-destructive/20 shrink-0">
            <WifiOff className="w-3.5 h-3.5" />
            You are offline — changes will sync when connected
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-background p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {NAV_ITEMS.map((item) => (
          <MobileNavLink key={item.href} {...item} />
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-14 h-full text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl h-[80vh] flex flex-col">
            <SheetHeader className="text-left pb-4 border-b border-border">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-auto py-4 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-4 mb-2 uppercase tracking-wider">Tools</p>
                <MobileMenuLink href="/followups" label="Follow-ups" icon={FileText} />
                <MobileMenuLink href="/reports" label="Reports" icon={LayoutDashboard} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-4 mb-2 uppercase tracking-wider">System</p>
                {(user.role === "admin" || user.role === "inspector" || user.role === "supervisor") && (
                  <MobileMenuLink href="/admin" label="Admin Panel" icon={ShieldAlert} />
                )}
                <MobileMenuLink href="/settings" label="Settings" icon={Settings} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

function DesktopNavLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(`${href}/`);
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
    )}>
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(`${href}/`);
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center w-14 h-full",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    )}>
      <Icon className={cn("w-5 h-5", isActive && "fill-primary/20")} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </Link>
  );
}

function MobileMenuLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground font-medium">
      <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center text-primary">
        <Icon className="w-4 h-4" />
      </div>
      {label}
    </Link>
  );
}
