import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, CheckCircle2, Circle, Calendar, Trash2, ClipboardList } from "lucide-react";
import { getFollowups, createFollowup, updateFollowup, deleteFollowup } from "@/lib/db";
import { useUser } from "@/context/AuthContext";
import type { Followup } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(),
  follow_up_date: z.string().min(1, "Date is required"),
});
type FormData = z.infer<typeof schema>;

export default function Followups() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");

  const { data: followups = [], isLoading } = useQuery({
    queryKey: ["followups"],
    queryFn: () => getFollowups(),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", notes: "", follow_up_date: new Date().toISOString().split("T")[0] },
  });

  const createMut = useMutation({
    mutationFn: (data: FormData) =>
      createFollowup({ ...data, notes: data.notes || null, completed: false, assigned_to: user?.id || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      toast.success("Follow-up created");
      form.reset();
      setOpen(false);
    },
    onError: () => toast.error("Failed to create follow-up"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateFollowup(id, { completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["followups"] }),
    onError: () => toast.error("Failed to update"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFollowup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      toast.success("Deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const today = new Date().toISOString().split("T")[0];

  const filtered = followups.filter((f) => {
    if (filter === "pending") return !f.completed;
    if (filter === "done") return f.completed;
    return true;
  });

  const overdue = filtered.filter((f) => !f.completed && f.follow_up_date < today);
  const upcoming = filtered.filter((f) => !f.completed && f.follow_up_date >= today);
  const done = filtered.filter((f) => f.completed);

  function onSubmit(data: FormData) {
    createMut.mutate(data);
  }

  function isOverdue(f: Followup) {
    return !f.completed && f.follow_up_date < today;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {followups.filter(f => !f.completed).length} pending tasks
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-followup" size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Follow-up</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input data-testid="input-title" placeholder="Follow up with customer..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="follow_up_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl><Input data-testid="input-date" type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl><Textarea data-testid="input-notes" placeholder="Additional context..." rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button data-testid="button-submit-followup" type="submit" className="w-full" disabled={createMut.isPending}>
                  {createMut.isPending ? "Creating..." : "Create Follow-up"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "done", "all"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
            onClick={() => setFilter(f)} className="capitalize" data-testid={`filter-${f}`}>
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <ClipboardList className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No follow-ups here</p>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Create one</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Overdue</p>
              <div className="space-y-2">
                {overdue.map(f => <FollowupCard key={f.id} followup={f} overdue onToggle={() => toggleMut.mutate({ id: f.id, completed: !f.completed })} onDelete={() => deleteMut.mutate(f.id)} />)}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Upcoming</p>
              <div className="space-y-2">
                {upcoming.map(f => <FollowupCard key={f.id} followup={f} onToggle={() => toggleMut.mutate({ id: f.id, completed: !f.completed })} onDelete={() => deleteMut.mutate(f.id)} />)}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed</p>
              <div className="space-y-2 opacity-60">
                {done.map(f => <FollowupCard key={f.id} followup={f} onToggle={() => toggleMut.mutate({ id: f.id, completed: !f.completed })} onDelete={() => deleteMut.mutate(f.id)} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FollowupCard({ followup: f, overdue, onToggle, onDelete }: {
  followup: Followup; overdue?: boolean; onToggle: () => void; onDelete: () => void;
}) {
  return (
    <Card data-testid={`card-followup-${f.id}`} className={cn("border", overdue && "border-destructive/40 bg-destructive/5")}>
      <CardContent className="p-4 flex items-start gap-3">
        <button onClick={onToggle} data-testid={`toggle-followup-${f.id}`} className="mt-0.5 shrink-0">
          {f.completed
            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
            : <Circle className="w-5 h-5 text-muted-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-sm leading-snug", f.completed && "line-through text-muted-foreground")}>{f.title}</p>
          {f.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{f.notes}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className={cn("text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
              {new Date(f.follow_up_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {overdue && <Badge variant="destructive" className="text-[10px] py-0 px-1.5">Overdue</Badge>}
          </div>
        </div>
        <button onClick={onDelete} data-testid={`delete-followup-${f.id}`} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}
