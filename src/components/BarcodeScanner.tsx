import { useEffect, useRef, useState, useCallback } from "react";
import { X, ScanBarcode, Flashlight, FlashlightOff, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [detected, setDetected] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(scanFrame); return; }
    ctx.drawImage(video, 0, 0);

    detector
      .detect(canvas)
      .then((results) => {
        if (results.length > 0) {
          const value = results[0].rawValue;
          const now = Date.now();
          // Debounce: don't re-fire same barcode within 2 seconds
          if (value !== lastScanRef.current || now - lastScanTimeRef.current > 2000) {
            lastScanRef.current = value;
            lastScanTimeRef.current = now;
            setDetected(true);
            setTimeout(() => setDetected(false), 600);
            stopCamera();
            onScan(value);
          }
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      })
      .catch(() => {
        rafRef.current = requestAnimationFrame(scanFrame);
      });
  }, [onScan, stopCamera]);

  useEffect(() => {
    async function start() {
      if (!("BarcodeDetector" in window)) {
        setStatus("error");
        setErrorMsg("Your browser doesn't support the Barcode Detection API. Use Chrome on Android, or type the barcode manually.");
        return;
      }

      try {
        const formats = await BarcodeDetector.getSupportedFormats();
        const wanted = ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "itf", "data_matrix", "pdf417"];
        const supported = wanted.filter((f) => formats.includes(f));
        detectorRef.current = new BarcodeDetector({ formats: supported.length ? supported : formats });
      } catch {
        detectorRef.current = new BarcodeDetector({ formats: ["code_128", "ean_13", "qr_code"] });
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities() as any;
        setTorchSupported(!!caps?.torch);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setStatus("scanning");
            rafRef.current = requestAnimationFrame(scanFrame);
          };
        }
      } catch (err: any) {
        setStatus("error");
        if (err.name === "NotAllowedError") {
          setErrorMsg("Camera permission denied. Please allow camera access and try again.");
        } else if (err.name === "NotFoundError") {
          setErrorMsg("No camera found on this device.");
        } else {
          setErrorMsg(err.message || "Could not access camera.");
        }
      }
    }

    start();
    return () => stopCamera();
  }, [scanFrame, stopCamera]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white z-10">
        <div className="flex items-center gap-2">
          <ScanBarcode className="w-5 h-5 text-primary" />
          <span className="font-semibold">Scan Barcode</span>
        </div>
        <div className="flex items-center gap-2">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title={torchOn ? "Turn off torch" : "Turn on torch"}
            >
              {torchOn ? <FlashlightOff className="w-5 h-5" /> : <Flashlight className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera view */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanner overlay */}
        {status === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dark vignette */}
            <div className="absolute inset-0 bg-black/40" style={{
              maskImage: "radial-gradient(ellipse 60% 35% at 50% 50%, transparent 100%, black 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 35% at 50% 50%, transparent 100%, black 100%)",
            }} />
            {/* Scan box */}
            <div className={`relative w-72 h-44 transition-all duration-200 ${detected ? "scale-105" : "scale-100"}`}>
              {/* Corners */}
              {[
                "top-0 left-0 border-t-2 border-l-2",
                "top-0 right-0 border-t-2 border-r-2",
                "bottom-0 left-0 border-b-2 border-l-2",
                "bottom-0 right-0 border-b-2 border-r-2",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 ${detected ? "border-green-400" : "border-primary"} transition-colors duration-200 ${cls}`} />
              ))}
              {/* Scanning line */}
              {!detected && (
                <div className="absolute inset-x-2 top-0 h-0.5 bg-primary/80 animate-scan" />
              )}
              {/* Flash on detect */}
              {detected && (
                <div className="absolute inset-0 bg-green-400/20 rounded border-2 border-green-400 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-green-400/30 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-green-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Starting spinner */}
        {status === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-3">
            <Camera className="w-12 h-12 animate-pulse text-primary" />
            <p className="text-sm">Starting camera…</p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-4 p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400" />
            <p className="text-sm text-gray-300">{errorMsg}</p>
            <Button onClick={handleClose} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Close Scanner
            </Button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {status === "scanning" && (
        <div className="px-4 py-3 bg-black/80 text-center text-sm text-gray-400">
          Point camera at barcode — auto-detects instantly
        </div>
      )}
    </div>
  );
}
