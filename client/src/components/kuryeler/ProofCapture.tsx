import { Button } from "@/components/ui/button";
import { goldBtn, ghostBtn } from "@/lib/kuryelerTheme";
import { useEffect, useRef, useState } from "react";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Fotoğraf okunamadı"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 640;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Fotoğraf işlenemedi"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.62));
      };
      img.onerror = () => reject(new Error("Fotoğraf açılamadı"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProofCapture({
  title,
  needPhoto,
  needSignature,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  needPhoto: boolean;
  needSignature: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (proof: { photo?: string; signature?: string }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 280;
    const height = 140;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#3a3014";
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  }, [needSignature]);

  const paint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#D4AF37";
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    setSigned(true);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="proof-title">
      <div className="w-full max-w-md rounded-3xl border border-[#3a3014] bg-[#101010] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <h2 id="proof-title" className="text-lg font-black text-[#D4AF37]">
          {title}
        </h2>
        <p className="mt-2 text-xs leading-5 text-[#8a7c52]">
          Yalnızca paketi veya teslim noktasını çekin; kişilerin yüzünü çekmeyin. Fotoğraf ve imza teslimin
          ispatı için [X] ay saklanır.
        </p>
        {needPhoto ? (
          <label className="mt-4 block">
            <span className="text-sm font-bold">Fotoğraf</span>
            <input
              className="mt-2 block w-full text-sm text-[#b4a882] file:mr-3 file:rounded-xl file:border-0 file:bg-[#D4AF37] file:px-3 file:py-2 file:font-bold file:text-black"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={event => {
                const file = event.target.files?.[0];
                if (!file) return;
                setBusy(true);
                void compressImage(file)
                  .then(setPhoto)
                  .finally(() => setBusy(false));
              }}
            />
            {photo ? <img src={photo} alt="Alım veya teslim fotoğrafı" className="mt-2 h-32 w-full rounded-2xl object-cover" /> : null}
          </label>
        ) : null}
        {needSignature ? (
          <div className="mt-4">
            <p className="text-sm font-bold">Teslim alan imzası</p>
            <canvas
              ref={canvasRef}
              className="mt-2 h-[140px] w-full touch-none rounded-2xl bg-[#141414]"
              onPointerDown={event => {
                drawing.current = true;
                canvasRef.current?.getContext("2d")?.beginPath();
                paint(event);
              }}
              onPointerMove={event => {
                if (drawing.current) paint(event);
              }}
              onPointerUp={() => {
                drawing.current = false;
              }}
            />
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className={ghostBtn} onClick={onCancel}>
            Vazgeç
          </Button>
          <Button
            type="button"
            className={goldBtn}
            disabled={busy || (needPhoto && !photo) || (needSignature && !signed)}
            onClick={() =>
              onConfirm({
                photo: photo ?? undefined,
                signature: needSignature ? canvasRef.current?.toDataURL("image/png") : undefined,
              })
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
