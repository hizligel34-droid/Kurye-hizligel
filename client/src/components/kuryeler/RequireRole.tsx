import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { useKuryelerAuth, panelPathForRole } from "@/contexts/KuryelerAuth";
import type { UserRole } from "@shared/kuryeler";
import { ROLE_LABELS } from "@shared/kuryeler";
import { useEffect } from "react";
import { useLocation } from "wouter";

const LOGIN: Record<UserRole, string> = {
  customer: "/musteri/giris",
  courier: "/kurye/giris",
  admin: "/yonetici/giris",
};

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user, loading } = useKuryelerAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(LOGIN[role]);
      return;
    }
    if (user.role !== role) {
      navigate(panelPathForRole(user.role));
    }
  }, [loading, user, role, navigate]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#0a0a0a] text-[#f5edd6]">
        <DemoBanner />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <BrandMark />
          <p className="text-sm text-[#b4a882]">
            {loading ? "Oturum kontrol ediliyor…" : `${ROLE_LABELS[role]} paneline yönlendiriliyorsunuz`}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
