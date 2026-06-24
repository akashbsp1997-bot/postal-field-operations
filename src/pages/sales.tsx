import { useSales } from "@/hooks/useQueries";
import { useCreateSale } from "@/hooks/useMutations";
import { useUser } from "@/context/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { IndianRupee, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Sales() {
  const { user } = useUser();
  const { data: sales, isLoading } = useSales(user?.id);
  const [open, setOpen] = useState(false);
  const createSale = useCreateSale();

  const [formData, setFormData] = useState({
    customer_name: "",
    product_name: "",
    amount: "",
  });

  const totalAmount = sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    createSale.mutate({
      customer_name: formData.customer_name,
      product_name: formData.product_name,
      amount: Number(formData.amount),
      sale_date: new Date().toISOString(),
      sold_by: user.id
    }, {
      onSuccess: () => {
        setOpen(false);
        setFormData({ customer_name: "", product_name: "", amount: "" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Register</h1>
          <p className="text-muted-foreground text-sm">Log daily collections and transactions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Log Sale</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input required value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Product/Service Details</Label>
                <Input required value={formData.product_name} placeholder="e.g. Stamps, IPPB Deposit" onChange={e => setFormData({...formData, product_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <Button type="submit" className="w-full" disabled={createSale.isPending}>
                Save Transaction
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Sales Collected</div>
            <div className="text-4xl font-bold text-primary flex items-center">
              <IndianRupee className="w-8 h-8 mr-1 opacity-80" />
              {totalAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
        ) : (
          sales?.map(sale => (
            <div key={sale.id} className="p-4 border border-border rounded-xl bg-card flex justify-between items-center">
              <div>
                <div className="font-semibold">{sale.customer_name}</div>
                <div className="text-sm text-muted-foreground">{sale.product_name} • {new Date(sale.sale_date).toLocaleDateString()}</div>
              </div>
              <div className="font-bold text-lg">₹{sale.amount.toLocaleString('en-IN')}</div>
            </div>
          ))
        )}
        {sales?.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-xl border-border text-muted-foreground">
            <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No sales logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
