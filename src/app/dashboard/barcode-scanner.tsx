"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const containerId = "qr-reader";

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(containerId);
    scannerRef.current = html5Qrcode;

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          html5Qrcode.stop().catch(() => {}).finally(() => onScan(decodedText));
        },
        undefined // suppress per-frame errors
      )
      .catch(() => {
        // Camera permission denied or unavailable — close the overlay
        onClose();
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan, onClose]);

  function handleClose() {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">Scan barcode</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:text-white hover:bg-white/20"
        >
          <X className="size-5" />
          <span className="sr-only">Close scanner</span>
        </Button>
      </div>

      {/* Camera preview */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="relative w-full max-w-sm">
          {/* html5-qrcode mounts its video here */}
          <div id={containerId} className="overflow-hidden rounded-lg" />

          {/* Scanning reticle overlay hint */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-64 rounded border-2 border-white/60" />
          </div>
        </div>
      </div>

      <p className="pb-8 text-center text-sm text-white/60">
        Point your camera at a product barcode
      </p>
    </div>
  );
}
