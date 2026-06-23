import { useState } from "react";
import { useArticles } from "@/hooks/useQueries";
import { useCreateDelivery, useCreateDeliveryProof } from "@/hooks/useMutations";
import { useUser } from "@/context/AuthContext";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProofOfDelivery from "@/components/ProofOfDelivery";
import { ScanBarcode, Package, X, Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Article } from "@/types";

export default function Delivery() {
  const { user } = useUser();
  const { data: articles, isLoading } = useArticles(user?.id);
  const createDelivery = useCreateDelivery();
  const createProof = useCreateDeliveryProof();

  const [barcode, setBarcode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedArticle, setScannedArticle] = useState<string | null>(null);
  const [proofArticle, setProofArticle] = useState<Article | null>(null);

  const processBarcode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setBarcode(trimmed);
    const match = articles?.find(
      (a) => a.barcode.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      setScannedArticle(match.id);
      toast.success(`Found: ${match.receiver}`);
      setTimeout(() => setScannedArticle(null), 4000);
    } else {
      toast.info(`Barcode: ${trimmed}`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcode(barcode);
    setBarcode("");
  };

  const handleCameraScan = (code: string) => {
    setScannerOpen(false);
    processBarcode(code);
  };

  // Opens the proof-of-delivery sheet instead of immediately marking
  const initiateDelivery = (article: Article) => setProofArticle(article);

  const handleProofConfirm = async (proof: {
    image_url: string | null;
    latitude: number | null;
    longitude: number | null;
    notes: string;
  }) => {
    if (!proofArticle || !user) return;
    try {
      // 1. Save delivery record
      await createDelivery.mutateAsync({
        article_id: proofArticle.id,
        delivery_status: "delivered",
        postman_id: user.id,
        remarks: proof.notes,
        delivered_at: new Date().toISOString(),
      });
      // 2. Save proof (photo + GPS)
      await createProof.mutateAsync({
        article_id: proofArticle.id,
        image_url: proof.image_url,
        latitude: proof.latitude,
        longitude: proof.longitude,
        delivered_at: new Date().toISOString(),
      });
      toast.success("Delivery confirmed with proof ✓");
      setProofArticle(null);
    } catch {
      toast.error("Failed to save delivery proof");
    }
  };

  const markStatus = (articleId: string, status: "failed" | "attempted") => {
    if (!user) return;
    createDelivery.mutate(
      { article_id: articleId, delivery_status: status, postman_id: user.id, remarks: "", delivered_at: new Date().toISOString() },
      {
        onSuccess: () => toast.success(`Marked as ${status}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const statusColor: Record<string, string> = {
    delivered: "bg-green-500/15 text-green-400 border-green-500/30",
    pending:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    attempted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    failed:    "bg-destructive/15 text-destructive border-destructive/30",
  };

  const isSaving = createDelivery.isPending || createProof.isPending;

  return (
    <>
      {scannerOpen && (
        <BarcodeScanner onScan={handleCameraScan} onClose={() => setScannerOpen(false)} />
      )}
      {proofArticle && (
        <ProofOfDelivery
          article={proofArticle}
          onConfirm={handleProofConfirm}
          onCancel={() => setProofArticle(null)}
          saving={isSaving}
        />
      )}

      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery Module</h1>
          <p className="text-muted-foreground text-sm">Scan articles and record proof of delivery.</p>
        </div>

        {/* Scan area */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <Button
              type="button"
              className="w-full h-14 text-base gap-3 bg-primary hover:bg-primary/90"
              onClick={() => setScannerOpen(true)}
            >
              <Camera className="w-6 h-6" />
              Scan Barcode with Camera
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              or enter manually
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. EM123456789IN"
                  className="pl-10 h-11 bg-background font-mono"
                />
              </div>
              <Button type="submit" className="h-11 px-5">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Article list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" /> Today's Articles
          </h2>

          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
          ) : articles?.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-border text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No articles assigned to you currently.</p>
            </div>
          ) : (
            articles?.map((article) => {
              const isHighlighted = scannedArticle === article.id;
              return (
                <Card
                  key={article.id}
                  className={`overflow-hidden transition-all duration-300 ${
                    isHighlighted ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.01]" : ""
                  }`}
                >
                  <div className="p-4 border-b border-border bg-accent/30 flex justify-between items-center gap-3">
                    <span className="font-mono font-bold tracking-wider text-sm truncate">{article.barcode}</span>
                    <Badge className={`shrink-0 text-xs border ${statusColor[article.status] ?? "bg-muted text-muted-foreground"}`}>
                      {article.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs uppercase mb-0.5">Receiver</div>
                        <div className="font-semibold">{article.receiver}</div>
                        <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">{article.address}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs uppercase mb-0.5">Type</div>
                        <div className="font-medium capitalize">{article.article_type}</div>
                      </div>
                    </div>
                  </CardContent>

                  {article.status !== "delivered" && (
                    <CardFooter className="p-2 bg-muted/50 gap-2">
                      {/* Delivered → opens proof sheet */}
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => initiateDelivery(article)}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Delivered
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => markStatus(article.id, "attempted")}
                        disabled={createDelivery.isPending}
                      >
                        Attempted
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => markStatus(article.id, "failed")}
                        disabled={createDelivery.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> Failed
                      </Button>
                    </CardFooter>
                  )}

                  {/* Delivered indicator with proof badge */}
                  {article.status === "delivered" && (
                    <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Delivered — proof of delivery saved
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
