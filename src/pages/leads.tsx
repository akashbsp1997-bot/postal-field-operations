import { useLeads } from "@/hooks/useQueries";
import { useCreateLead } from "@/hooks/useMutations";
import { useUser } from "@/context/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Phone, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Leads() {
  const { user } = useUser();
  const { data: leads, isLoading } = useLeads(user?.id);
  const [open, setOpen] = useState(false);
  const createLead = useCreateLead();

  const [formData, setFormData] = useState({
    prospect_name: "",
    mobile: "",
    lead_type: "insurance",
    source: "field",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    createLead.mutate({
      ...formData,
      status: "new",
      remarks: "",
      assigned_to: user.id
    }, {
      onSuccess: () => {
        setOpen(false);
        setFormData({ prospect_name: "", mobile: "", lead_type: "insurance", source: "field" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Generation</h1>
          <p className="text-muted-foreground text-sm">Capture PLI, RPLI, and IPPB leads.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Lead</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Postal Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Prospect Name</Label>
                <Input required value={formData.prospect_name} onChange={e => setFormData({...formData, prospect_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input required type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Product Category</Label>
                <Select value={formData.lead_type} onValueChange={v => setFormData({...formData, lead_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insurance">Insurance (PLI/RPLI)</SelectItem>
                    <SelectItem value="savings">Savings (IPPB/POSB)</SelectItem>
                    <SelectItem value="philately">Philately</SelectItem>
                    <SelectItem value="parcel">Parcel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createLead.isPending}>
                Save Lead
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : (
          leads?.map(lead => (
            <Card key={lead.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{lead.prospect_name}</div>
                    <div className="text-xs text-muted-foreground uppercase">{lead.lead_type}</div>
                  </div>
                  <Badge variant={lead.status === 'converted' ? 'default' : lead.status === 'new' ? 'secondary' : 'outline'}>
                    {lead.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center text-sm gap-2 mt-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {lead.mobile}
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {leads?.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed rounded-xl border-border text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No leads captured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
