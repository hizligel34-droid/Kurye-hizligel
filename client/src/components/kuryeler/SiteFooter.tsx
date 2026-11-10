import { contactEmail, contactPhoneDisplay } from "@/lib/contact";
import { BRAND_CITY, BRAND_NAME } from "@shared/kuryeler";
import { MapPin } from "lucide-react";
import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#3a3014] bg-black py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 text-sm text-[#8a7c52] md:flex-row md:items-center md:justify-between">
        <div>
          <p>© {new Date().getFullYear()} {BRAND_NAME}</p>
          <p className="mt-1 inline-flex items-center gap-2">
            <MapPin className="size-4 text-[#D4AF37]" aria-hidden />
            {BRAND_CITY}, Türkiye
          </p>
        </div>
        <nav aria-label="Yasal ve iletişim" className="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
          <a className="hover:text-[#D4AF37]" href={`mailto:${contactEmail()}`}>
            {contactEmail()}
          </a>
          <a className="hover:text-[#D4AF37]" href={`tel:+90${contactPhoneDisplay().replace(/\D/g, "").slice(-10)}`}>
            {contactPhoneDisplay()}
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
