import { useUser } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Building2, Phone, Mail, Shield, Hash } from "lucide-react";
import type { UserRole } from "@/types";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  inspector: "Inspector",
  supervisor: "Supervisor",
  postman: "Postman",
  bpm_spm: "BPM / SPM",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  inspector: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  supervisor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  postman: "bg-green-500/20 text-green-400 border-green-500/30",
  bpm_spm: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function Settings() {
  const { user, signOut } = useUser();

  if (!user) return null;

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your profile and account information</p>
      </div>

      {/* Profile Card */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0" data-testid="avatar-initials">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg" data-testid="text-username">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.designation}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium mt-1 ${roleColors[user.role]}`} data-testid="badge-role">
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <InfoRow icon={Hash} label="Employee ID" value={user.employee_id} testId="text-employee-id" />
          <Separator />
          <InfoRow icon={Mail} label="Email" value={user.email} testId="text-email" />
          <Separator />
          <InfoRow icon={Phone} label="Mobile" value={user.mobile || "Not set"} testId="text-mobile" />
          <Separator />
          <InfoRow icon={Shield} label="Role" value={roleLabels[user.role]} testId="text-role" />
          <Separator />
          <InfoRow
            icon={User}
            label="Status"
            value={user.active ? "Active" : "Inactive"}
            testId="text-status"
            valueClass={user.active ? "text-green-500" : "text-destructive"}
          />
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">App Name</span>
            <span className="text-sm font-medium">Tensa Postal Beat</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Platform</span>
            <span className="text-sm font-medium">India Post Field Operations</span>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={signOut}
        data-testid="button-signout"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, testId, valueClass }: {
  icon: any; label: string; value: string; testId: string; valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className={`text-sm font-medium ${valueClass || ""}`} data-testid={testId}>{value}</span>
    </div>
  );
}
