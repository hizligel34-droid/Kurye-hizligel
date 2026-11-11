import { KunyeBlock } from "@/components/kuryeler/KunyeBlock";
import { contactPhoneDisplay, contactPhoneTel } from "@/lib/contact";
import { getBusinessProfile } from "@/lib/kuryelerApi";
import { BRAND_NAME, BUSINESS } from "@shared/kuryeler";
import type { BusinessProfile } from "@shared/businessProfile";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export function SiteFooter() {
  const [profile, setProfile] = useState<BusinessProfile>(BUSINESS);
  const phone = contactPhoneDisplay();
  const tel = contactPhoneTel();
  useEffect(() => {
    void getBusinessProfile()
      .then(setProfile)
      .catch(() => setProfile(BUSINESS));
  }, []);
  return (
    <footer className="border-t border-[#3a3014] bg-black py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 text-sm text-[#b4a882] md:flex-row md:items-center md:justify-between">
        <div>
          <p>© {new Date().getFullYear()} {BRAND_NAME}</p>
          <p className="mt-1 inline-flex items-center gap-2">
            <MapPin className="size-4 text-[#D4AF37]" aria-hidden />
            {profile.address}
          </p>
          <div className="mt-3">
            <p className="text-xs leading-6">
              Hizmet sağlayıcı ve veri sorumlusu: {profile.legalName} – Hızlıgel / kuryeler.tr
            </p>
            <KunyeBlock profile={profile} compact />
          </div>
        </div>
        <nav aria-label="Yasal ve iletişim" className="flex flex-wrap gap-2 font-semibold">
          <Link href="/kunye" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            Künye
          </Link>
          <Link href="/iletisim" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            İletişim
          </Link>
          <Link href="/islem-rehberi" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            İşlem rehberi
          </Link>
          <Link href="/sss" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            SSS
          </Link>
          {profile.email === "?" ? (
            <span className="inline-flex min-h-11 items-center px-2">E-posta: ?</span>
          ) : (
            <a className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          )}
          <a className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]" href={tel}>
            {phone}
          </a>
          <Link href="/on-bilgilendirme" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            Ön bilgi
          </Link>
          <Link href="/kvkk" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            KVKK
          </Link>
          <Link href="/cerez" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            Çerez
          </Link>
          <Link href="/kullanim-kosullari" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            Kullanım koşulları
          </Link>
          <Link href="/odeme-bilgisi" className="inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]">
            Ödeme
          </Link>
        </nav>
      </div>
    </footer>
  );
}
