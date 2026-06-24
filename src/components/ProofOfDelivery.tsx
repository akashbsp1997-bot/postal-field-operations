import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, MapPin, CheckCircle2, X, Loader2, AlertTriangle, Navigation, RefreshCw, ImagePlus, PenLine, Trash2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Article } from "@/types";

interface ProofOfDeliveryProps {
  article: Article;
  onConfirm: (proof: {
    image_url: string | null;
    signature_url: string | null;
    latitude: number | null;
    longitude: number | null;
    notes: string;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

type GpsStatus = "idle" | "getting" | "ok" | "denied" | "unavailable";
type Step = "proof" | "signature" | "review";

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
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      let quality = 0.8;
      const tryEncode = () => {
        const data = canvas.toDataURL("image/jpeg", quality);
        if (Math.round((data.length * 3) / 4 / 1024) > maxKB && quality > 0.2) { quality -= 0.1; tryEncode(); }
        else resolve(data);
      };
      tryEncode();
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProofOfDelivery({ article, onConfirm, onCancel, saving }: ProofOfDeliveryProps) {
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const sigCanvasRef   = useRef<HTMLCanvasElement>(null);
  const [step, setStep]       = useState<Step>("proof");
  const [photo, setPhoto]     = useState<string | null>(null);
  const [sigUrl, setSigUrl]   = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSig, setHasSig]   = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [coords, setCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [notes, setNotes]     = useState("");
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getGps = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus("unavailable"); return; }
    setGpsStatus("getting"); setGpsError("");
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsStatus("ok"); },
      err => {
        setGpsStatus(err.code === 1 ? "denied" : "unavailable");
        setGpsError(err.code === 1 ? "Location denied — enable it in browser settings." : "Could not get location. Try again.");
      },
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => { getGps(); }, [getGps]);

  // ─── Photo ───────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try { setPhoto(await compressImage(file, 300)); }
    catch { setPhoto(URL.createObjectURL(file)); }
    finally { setCompressing(false); }
  };

  // ─── Signature Canvas (mouse + touch) ────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = sigCanvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pos = getPos(e, rect);
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    lastPoint.current = pos;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pos = getPos(e, rect);
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPoint.current = pos;
    setHasSig(true);
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); setIsDrawing(false); };

  const clearSig = () => {
    const canvas = sigCanvasRef.current; if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  const saveSig = () => {
    const canvas = sigCanvasRef.current; if (!canvas || !hasSig) return;
    setSigUrl(canvas.toDataURL("image/png")); setStep("review");
  };

  const skipSig = () => { setSigUrl(null); setStep("review"); };

  // ─── Submit ──────────────────────────────────────────────
  const handleConfirm = () => {
    onConfirm({ image_url: photo, signature_url: sigUrl, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null, notes });
  };

  const mapsUrl = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[95dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-base">Proof of Delivery</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[240px]">{article.barcode}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicators */}
            <div className="flex items-center gap-1.5">
              {(["proof","signature","review"] as Step[]).map((s, i) => (
                <div key={s} className={`w-2 h-2 rounded-full transition-colors ${step === s ? "bg-primary" : i < ["proof","signature","review"].indexOf(step) ? "bg-primary/40" : "bg-muted"}`} />
              ))}
            </div>
            <button onClick={onCancel} className="p-2 rounded-full hover:bg-accent transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* STEP 1: Photo + GPS + Notes */}
            {step === "proof" && (
              <>
                {/* Article info */}
                <div className="bg-accent/40 rounded-xl p-3 text-sm space-y-1">
                  <div className="font-semibold">{article.receiver}</div>
                  <div className="text-muted-foreground text-xs leading-relaxed">{article.address}</div>
                  <div className="text-xs text-muted-foreground capitalize">{article.article_type}</div>
                </div>

                {/* Photo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" /> Photo Evidence
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  {photo ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={photo} alt="Proof" className="w-full max-h-52 object-cover" />
                      <button onClick={() => { setPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Captured
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()} disabled={compressing}
                      className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                      {compressing ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <ImagePlus className="w-8 h-8 group-hover:text-primary transition-colors" />}
                      <span className="text-sm font-medium">{compressing ? "Processing…" : "Tap to take photo"}</span>
                      <span className="text-xs">Opens rear camera</span>
                    </button>
                  )}
                </div>

                {/* GPS */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" /> GPS Location
                  </label>
                  <div className={`rounded-xl border p-3 text-sm flex items-start gap-3 ${
                    gpsStatus === "ok" ? "border-green-500/30 bg-green-500/10" :
                    gpsStatus === "getting" ? "border-border bg-accent/30" : "border-yellow-500/30 bg-yellow-500/10"}`}>
                    {gpsStatus === "getting" && <Loader2 className="w-5 h-5 shrink-0 animate-spin text-muted-foreground" />}
                    {gpsStatus === "ok" && <Navigation className="w-5 h-5 shrink-0 text-green-400" />}
                    {(gpsStatus === "denied" || gpsStatus === "unavailable" || gpsStatus === "idle") && <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-400" />}
                    <div className="flex-1 min-w-0">
                      {gpsStatus === "getting" && <p className="text-muted-foreground text-xs">Getting location…</p>}
                      {gpsStatus === "ok" && coords && (
                        <div className="space-y-0.5">
                          <p className="text-green-400 font-medium text-xs">Location captured</p>
                          <p className="font-mono text-xs text-muted-foreground">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
                          {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View on Maps ↗</a>}
                        </div>
                      )}
                      {(gpsStatus === "denied" || gpsStatus === "unavailable") && (
                        <div>
                          <p className="text-yellow-400 text-xs">{gpsError}</p>
                          <button onClick={getGps} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                            <RefreshCw className="w-3 h-3" /> Retry
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Remarks <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Left with neighbour, Delivered at gate…" className="resize-none bg-background text-sm" rows={2} />
                </div>
              </>
            )}

            {/* STEP 2: Signature */}
            {step === "signature" && (
              <div className="space-y-4">
                {photo && (
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Photo evidence captured
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <PenLine className="w-4 h-4 text-primary" /> Recipient Signature
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <p className="text-xs text-muted-foreground">Ask the recipient to sign below with their finger.</p>
                  <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-border bg-white" style={{ touchAction: "none" }}>
                    <canvas
                      ref={sigCanvasRef}
                      width={480}
                      height={160}
                      className="w-full cursor-crosshair block"
                      style={{ touchAction: "none" }}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                    {!hasSig && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-400 text-sm">Sign here</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearSig} className="gap-1.5" disabled={!hasSig}>
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </Button>
                    <Button size="sm" onClick={saveSig} className="flex-1 gap-1.5" disabled={!hasSig}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Save Signature
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={skipSig} className="w-full gap-1.5 text-muted-foreground">
                    <SkipForward className="w-3.5 h-3.5" /> Skip — no signature
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {step === "review" && (
              <div className="space-y-4">
                <p className="text-sm font-medium">Review before confirming</p>

                {photo && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Photo Evidence</p>
                    <img src={photo} alt="Proof" className="w-full rounded-xl border border-border max-h-40 object-cover" />
                  </div>
                )}

                {sigUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Signature</p>
                    <img src={sigUrl} alt="Signature" className="w-full rounded-xl border border-border bg-white max-h-24 object-contain" />
                  </div>
                )}

                <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${gpsStatus === "ok" ? "border-green-500/30 bg-green-500/10" : "border-border bg-accent/30"}`}>
                  <p className="font-medium text-sm">Delivery Summary</p>
                  <p><span className="text-muted-foreground">Receiver:</span> {article.receiver}</p>
                  <p><span className="text-muted-foreground">Barcode:</span> <span className="font-mono">{article.barcode}</span></p>
                  {coords && <p><span className="text-muted-foreground">GPS:</span> {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>}
                  {notes && <p><span className="text-muted-foreground">Remarks:</span> {notes}</p>}
                  <p><span className="text-muted-foreground">Time:</span> {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  {!photo && !sigUrl && <p className="text-yellow-400">⚠ No photo or signature captured</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 shrink-0 bg-card">
          {step === "proof" && (
            <>
              <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={() => setStep("signature")} disabled={gpsStatus === "getting" || compressing}>
                <PenLine className="w-4 h-4" /> Next: Signature
              </Button>
            </>
          )}
          {step === "signature" && (
            <Button variant="outline" className="flex-1" onClick={() => setStep("proof")}>← Back</Button>
          )}
          {step === "review" && (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setStep("signature")}>← Back</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" onClick={handleConfirm} disabled={saving || compressing}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? "Saving…" : "Confirm Delivery"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
