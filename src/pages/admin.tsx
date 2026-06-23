import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShieldAlert, Users, Building2, Map } from "lucide-react";
import { getUsers, getOffices, getAreas, createOffice, updateOffice, deleteOffice, createArea, updateArea, deleteArea, updateUser, deleteUser } from "@/lib/db";
import { useUser } from "@/context/AuthContext";
import type { AppUser, Office, Area, UserRole } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const officeSchema = z.object({
  office_name: z.string().min(1),
  office_type: z.string().min(1),
  office_code: z.string().min(1),
  pincode: z.string().min(6).max(6),
});

const areaSchema = z.object({
  name: z.string().min(1),
  beat_number: z.string().min(1),
  office_id: z.string().min(1),
  assigned_to: z.string().optional(),
});

export default function Admin() {
  const { user } = useUser();

  if (!user || !["admin", "inspector", "supervisor"].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/40" />
        <p className="font-semibold">Access Restricted</p>
        <p className="text-muted-foreground text-sm">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage users, offices, and beat assignments</p>
      </div>
      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="users" data-testid="tab-users"><Users className="w-4 h-4 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="offices" data-testid="tab-offices"><Building2 className="w-4 h-4 mr-1.5" />Offices</TabsTrigger>
          <TabsTrigger value="areas" data-testid="tab-areas"><Map className="w-4 h-4 mr-1.5" />Beat Areas</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="offices"><OfficesTab /></TabsContent>
        <TabsContent value="areas"><AreasTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: getUsers });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateUser(id, { active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Updated"); },
    onError: () => toast.error("Failed to update"),
  });

  const roleBadgeColor: Record<UserRole, string> = {
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    inspector: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    supervisor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    postman: "bg-green-500/20 text-green-400 border-green-500/30",
    bpm_spm: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  if (isLoading) return <div className="space-y-2 pt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="pt-4 space-y-2">
      {users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No users found. Create users via Supabase Auth + insert profile into users table.</div>
      ) : users.map((u) => (
        <Card key={u.id} data-testid={`card-user-${u.id}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
              {u.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{u.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${roleBadgeColor[u.role] || ""}`}>{u.role}</span>
              </div>
              <p className="text-xs text-muted-foreground">{u.employee_id} · {u.designation}</p>
            </div>
            <Button
              variant={u.active ? "outline" : "secondary"}
              size="sm"
              data-testid={`toggle-user-${u.id}`}
              onClick={() => toggleActiveMut.mutate({ id: u.id, active: !u.active })}
              disabled={toggleActiveMut.isPending}
            >
              {u.active ? "Active" : "Inactive"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OfficesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Office | null>(null);
  const { data: offices = [], isLoading } = useQuery({ queryKey: ["offices"], queryFn: getOffices });

  const form = useForm<z.infer<typeof officeSchema>>({
    resolver: zodResolver(officeSchema),
    defaultValues: { office_name: "", office_type: "Sub Post Office", office_code: "", pincode: "" },
  });

  function openNew() { form.reset({ office_name: "", office_type: "Sub Post Office", office_code: "", pincode: "" }); setEditing(null); setOpen(true); }
  function openEdit(o: Office) { form.reset(o); setEditing(o); setOpen(true); }

  const saveMut = useMutation({
    mutationFn: (data: z.infer<typeof officeSchema>) =>
      editing ? updateOffice(editing.id, data) : createOffice(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offices"] }); toast.success(editing ? "Updated" : "Created"); setOpen(false); },
    onError: () => toast.error("Failed to save"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteOffice(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offices"] }); toast.success("Deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div className="pt-4 space-y-3">
      <Button size="sm" className="gap-2" onClick={openNew} data-testid="button-add-office"><Plus className="w-4 h-4" />Add Office</Button>

      {isLoading ? <Skeleton className="h-48 rounded-xl" /> : (
        <div className="space-y-2">
          {offices.map(o => (
            <Card key={o.id} data-testid={`card-office-${o.id}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{o.office_name}</p>
                  <p className="text-xs text-muted-foreground">{o.office_code} · PIN {o.pincode} · {o.office_type}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)} data-testid={`edit-office-${o.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(o.id)} data-testid={`delete-office-${o.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Office" : "New Office"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => saveMut.mutate(d))} className="space-y-3">
              <FormField control={form.control} name="office_name" render={({ field }) => (
                <FormItem><FormLabel>Office Name</FormLabel><FormControl><Input data-testid="input-office-name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="office_type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-office-type"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {["Head Post Office", "Sub Post Office", "Branch Post Office", "Extra Departmental Branch Office"].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="office_code" render={({ field }) => (
                  <FormItem><FormLabel>Office Code</FormLabel><FormControl><Input data-testid="input-office-code" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input data-testid="input-pincode" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={saveMut.isPending}>{saveMut.isPending ? "Saving..." : "Save Office"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AreasTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const { data: areas = [], isLoading } = useQuery({ queryKey: ["areas"], queryFn: () => getAreas() });
  const { data: offices = [] } = useQuery({ queryKey: ["offices"], queryFn: getOffices });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const postmen = users.filter(u => u.role === "postman" || u.role === "bpm_spm");

  const form = useForm<z.infer<typeof areaSchema>>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: "", beat_number: "", office_id: "", assigned_to: "" },
  });

  function openNew() { form.reset({ name: "", beat_number: "", office_id: offices[0]?.id || "", assigned_to: "" }); setEditing(null); setOpen(true); }
  function openEdit(a: Area) { form.reset({ ...a, assigned_to: a.assigned_to || "" }); setEditing(a); setOpen(true); }

  const saveMut = useMutation({
    mutationFn: (data: z.infer<typeof areaSchema>) => {
      const payload = { ...data, assigned_to: data.assigned_to || null };
      return editing ? updateArea(editing.id, payload) : createArea(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["areas"] }); toast.success(editing ? "Updated" : "Created"); setOpen(false); },
    onError: () => toast.error("Failed to save"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteArea(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["areas"] }); toast.success("Deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const officeMap = Object.fromEntries(offices.map(o => [o.id, o.office_name]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  return (
    <div className="pt-4 space-y-3">
      <Button size="sm" className="gap-2" onClick={openNew} data-testid="button-add-area"><Plus className="w-4 h-4" />Add Beat Area</Button>

      {isLoading ? <Skeleton className="h-48 rounded-xl" /> : (
        <div className="space-y-2">
          {areas.map(a => (
            <Card key={a.id} data-testid={`card-area-${a.id}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <Map className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Beat {a.beat_number} · {officeMap[a.office_id] || "Unknown Office"}
                    {a.assigned_to && ` · ${userMap[a.assigned_to] || "Assigned"}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)} data-testid={`edit-area-${a.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(a.id)} data-testid={`delete-area-${a.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Area" : "New Beat Area"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => saveMut.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Area Name</FormLabel><FormControl><Input data-testid="input-area-name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="beat_number" render={({ field }) => (
                  <FormItem><FormLabel>Beat No.</FormLabel><FormControl><Input data-testid="input-beat-number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="office_id" render={({ field }) => (
                <FormItem><FormLabel>Office</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-office"><SelectValue placeholder="Select office" /></SelectTrigger></FormControl>
                    <SelectContent>{offices.map(o => <SelectItem key={o.id} value={o.id}>{o.office_name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="assigned_to" render={({ field }) => (
                <FormItem><FormLabel>Assign Postman (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-postman"><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {postmen.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={saveMut.isPending}>{saveMut.isPending ? "Saving..." : "Save Area"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
