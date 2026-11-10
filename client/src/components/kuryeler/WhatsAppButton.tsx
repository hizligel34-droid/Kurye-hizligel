import { whatsappHref } from "@/lib/contact";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 font-bold text-black hover:bg-[#3adf75] ${className}`}
    >
      <MessageCircle className="size-5" aria-hidden />
      WhatsApp ile yazın
    </a>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile yazın"
      className="fixed bottom-5 right-4 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-black shadow-[0_8px_30px_rgba(37,211,102,0.35)]"
    >
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}
