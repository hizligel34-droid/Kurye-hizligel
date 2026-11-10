import { ghostBtn, cardClass } from "@/lib/kuryelerTheme";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export function SkipLink() {
  return (
    <a
      href="#icerik"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[#D4AF37] focus:px-4 focus:py-2 focus:font-bold focus:text-black"
    >
      İçeriğe geç
    </a>
  );
}

export function LoadingState({ label = "Yükleniyor…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${cardClass} flex items-center gap-3 p-5 text-sm text-[#b4a882]`}
    >
      <Loader2 className="size-5 animate-spin text-[#D4AF37]" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${cardClass} p-6 text-center sm:p-8`}>
      <Inbox className="mx-auto size-10 text-[#D4AF37]" aria-hidden />
      <h2 className="mt-3 text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#8a7c52]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className={`${cardClass} p-6`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#D4AF37]" aria-hidden />
        <div className="min-w-0">
          <p className="font-bold">Bir sorun oluştu</p>
          <p className="mt-1 text-sm text-[#8a7c52]">{message}</p>
          {onRetry ? (
            <Button className={`mt-4 ${ghostBtn}`} onClick={onRetry}>
              <RefreshCw className="size-4" /> Yeniden dene
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-semibold text-[#e3b34a]">
      {message}
    </p>
  );
}
