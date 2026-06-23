import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, MapPin, CheckCircle2, X, Loader2, AlertTriangle, Navigation, RefreshCw, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Article } from "@/types";

interface ProofOfDeliveryProps {
  article: Article;
  onConfirm: (proof: { image_url: string | null; latitude: number | null; longitude: number | null; notes: string }) => void;
  onCancel: () => void;
  saving?: boolean;
}

type GpsStatus = "idle" | "getting" | "ok" | "denied" | "unavailable";

function compressImage(file: File, maxKB = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1280;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      let quality = 0.8;
      const tryEncode = () => {
        const data = canvas.toDataURL("image/jpeg", quality);
        const kb = Math.round((data.length * 3) / 4 / 1024);
        if (kb > maxKB && quality > 0.2) { quality -= 0.1; tryEncode(); }
        else resolve(data);
      };
      tryEncode();
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProofOfDelivery({ article, onConfirm, onCancel, saving }: ProofOfDeliveryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [notes, setNotes] = useState("");
  const [compressing, setCompressing] = useState(false);

  const getGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    setGpsStatus("getting");
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ok");
      },
      (err) => {
        setGpsStatus(err.code === 1 ? "denied" : "unavailable");
        setGpsError(
          err.code === 1
            ? "Location access denied. Enable it in browser settings."
            : "Could not get location. Try again."
        );
      },
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => { getGps(); }, [getGps]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file, 300);
      setPhoto(compressed);
    } catch {
      setPhoto(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      image_url: photo,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      notes,
    });
  };

  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[95dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-base">Proof of Delivery</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[240px]">{article.barcode}</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* Article info */}
            <div className="bg-accent/40 rounded-xl p-3 text-sm space-y-1">
              <div className="font-semibold">{article.receiver}</div>
              <div className="text-muted-foreground text-xs leading-relaxed">{article.address}</div>
              <div className="text-xs text-muted-foreground capitalize">{article.article_type}</div>
            </div>

            {/* Photo section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-primary" />
                Photo Evidence
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {photo ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={photo} alt="Proof" className="w-full max-h-52 object-cover" />
                  <button
                    onClick={() => { setPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Photo captured
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={compressing}
                  className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  {compressing ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  ) : (
                    <ImagePlus className="w-8 h-8 group-hover:text-primary transition-colors" />
                  )}
                  <span className="text-sm font-medium">
                    {compressing ? "Processing…" : "Tap to take photo"}
                  </span>
                  <span className="text-xs">Opens rear camera directly</span>
                </button>
              )}
            </div>

            {/* GPS section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                GPS Location
              </label>

              <div className={`rounded-xl border p-3 text-sm flex items-start gap-3 ${
                gpsStatus === "ok" ? "border-green-500/30 bg-green-500/10" :
                gpsStatus === "getting" ? "border-border bg-accent/30" :
                gpsStatus === "denied" || gpsStatus === "unavailable" ? "border-yellow-500/30 bg-yellow-500/10" :
                "border-border bg-accent/30"
              }`}>
                {gpsStatus === "getting" && <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin text-muted-foreground" />}
                {gpsStatus === "ok" && <Navigation className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />}
                {(gpsStatus === "denied" || gpsStatus === "unavailable") && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-400" />}
                {gpsStatus === "idle" && <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />}

                <div className="flex-1 min-w-0">
                  {gpsStatus === "getting" && <p className="text-muted-foreground">Getting your location…</p>}
                  {gpsStatus === "ok" && coords && (
                    <div className="space-y-1">
                      <p className="text-green-400 font-medium text-xs">Location captured</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                      </p>
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                          View on Google Maps ↗
                        </a>
                      )}
                    </div>
                  )}
                  {(gpsStatus === "denied" || gpsStatus === "unavailable") && (
                    <div className="space-y-1">
                      <p className="text-yellow-400 text-xs">{gpsError || "Location unavailable"}</p>
                      <button onClick={getGps} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Try again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Left with neighbour, Delivered at gate, Receiver not available…"
                className="resize-none bg-background text-sm"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border flex gap-3 shrink-0 bg-card">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
            onClick={handleConfirm}
            disabled={saving || compressing || gpsStatus === "getting"}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Saving…" : "Confirm Delivery"}
          </Button>
        </div>
      </div>
    </div>
  );
}
