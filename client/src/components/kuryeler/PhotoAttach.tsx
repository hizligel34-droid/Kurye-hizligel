import { fileToSafePhoto } from "@/lib/kuryelerMedia";
import { useState } from "react";

export function PhotoAttach({
  label = "Fotoğraf",
  value,
  onChange,
}: {
  label?: string;
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[#D4AF37]">{label}</span>
      <input
        className="mt-1 block w-full text-sm text-[#b4a882] file:mr-3 file:rounded-xl file:border-0 file:bg-[#D4AF37] file:px-3 file:py-2 file:font-bold file:text-black"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        aria-busy={busy}
        onChange={event => {
          const file = event.target.files?.[0];
          if (!file) return;
          setBusy(true);
          void fileToSafePhoto(file)
            .then(photo => onChange(photo))
            .finally(() => setBusy(false));
        }}
      />
      {value ? (
        <img src={value} alt="Eklenen fotoğraf" className="mt-2 h-32 w-full rounded-2xl object-cover" />
      ) : null}
    </label>
  );
}
