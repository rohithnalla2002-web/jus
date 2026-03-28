import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecoded: (text: string) => void;
};

/** Avoid "Cannot stop, scanner is not running" when stop runs twice or before start finishes. */
async function safeShutdownScanner(scanner: Html5Qrcode | null) {
  if (!scanner) return;
  try {
    const state = scanner.getState();
    if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
      await scanner.stop();
    }
    scanner.clear();
  } catch {
    /* already stopped or DOM cleared */
  }
}

export function QrScanDialog({ open, onOpenChange, onDecoded }: Props) {
  const [readerId] = useState(() => `h5qr-${Math.random().toString(36).slice(2, 12)}`);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const onDecodedRef = useRef(onDecoded);
  onDecodedRef.current = onDecoded;

  useEffect(() => {
    if (!open) {
      setError(null);
      handledRef.current = false;
      return;
    }

    let cancelled = false;
    let instance: Html5Qrcode | null = null;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;

      const scanner = new Html5Qrcode(readerId, false);
      instance = scanner;
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            if (cancelled || handledRef.current) return;
            handledRef.current = true;
            void safeShutdownScanner(scanner).finally(() => {
              scannerRef.current = null;
              if (!cancelled) {
                onDecodedRef.current(decodedText);
                onOpenChange(false);
              }
            });
          },
          () => {},
        );
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Could not access camera";
          setError(msg);
        }
        instance = null;
        scannerRef.current = null;
      }
    };

    void run();

    return () => {
      cancelled = true;
      const s = instance ?? scannerRef.current;
      scannerRef.current = null;
      void safeShutdownScanner(s);
    };
  }, [open, readerId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan product QR</DialogTitle>
          <DialogDescription>Point the camera at the jewellery label QR code.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        ) : null}
        <div id={readerId} className="min-h-[280px] w-full overflow-hidden rounded-lg bg-black" />
        <p className="text-center text-xs text-muted-foreground">Requires camera permission. You can close and enter the ID manually instead.</p>
      </DialogContent>
    </Dialog>
  );
}
