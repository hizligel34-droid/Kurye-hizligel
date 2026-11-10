import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import type { UserRole } from "@shared/kuryeler";
import { ROLE_LABELS } from "@shared/kuryeler";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user, loading, wrongRole } = useKuryelerAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/giris");
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#0a0a0a] text-[#f5edd6]">
        <DemoBanner />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <BrandMark href="/" />
          <p className="text-sm text-[#b4a882]">
            {loading ? "Oturum kontrol ediliyor…" : `${ROLE_LABELS[role]} girişi gerekiyor`}
          </p>
          {wrongRole ? (
            <p className="max-w-sm text-center text-xs text-[#8a7c52]">
              Bu hesap {ROLE_LABELS[wrongRole]} içindir. Lütfen ilgili Hızlıgel uygulamasını açın.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
