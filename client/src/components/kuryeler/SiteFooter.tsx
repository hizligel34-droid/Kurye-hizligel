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
        <nav aria-label="Yasal ve iletişim" className="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
          <Link href="/iletisim" className="hover:text-[#D4AF37]">
            İletişim
          </Link>
          <Link href="/islem-rehberi" className="hover:text-[#D4AF37]">
            İşlem rehberi
          </Link>
          {profile.email === "?" ? (
            <span>E-posta: ?</span>
          ) : (
            <a className="hover:text-[#D4AF37]" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          )}
          <a className="hover:text-[#D4AF37]" href={tel}>
            {phone}
          </a>
          <Link href="/kvkk" className="hover:text-[#D4AF37]">
            KVKK
          </Link>
          <Link href="/kosullar" className="hover:text-[#D4AF37]">
            Kullanım koşulları
          </Link>
        </nav>
      </div>
    </footer>
  );
}
