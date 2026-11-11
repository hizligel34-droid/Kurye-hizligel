import { contactEmail, contactPhoneDisplay, contactPhoneTel, whatsappHref } from "@/lib/contact";
import { BUSINESS } from "@shared/kuryeler";

export function PwaLegalLinks() {
  const phone = contactPhoneDisplay();
  const email = BUSINESS.email === "?" ? "?" : contactEmail();
  return (
    <nav aria-label="İletişim ve yasal" className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#8a7c52]">
      <a className="hover:text-[#D4AF37]" href={contactPhoneTel()}>
        {phone}
      </a>
      <a className="hover:text-[#D4AF37]" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      {email === "?" ? (
        <span>E-posta: ?</span>
      ) : (
        <a className="hover:text-[#D4AF37]" href={`mailto:${email}`}>
          {email}
        </a>
      )}
      <a className="hover:text-[#D4AF37]" href="/sss">
        SSS
      </a>
      <a className="hover:text-[#D4AF37]" href="/kvkk">
        KVKK
      </a>
      <a className="hover:text-[#D4AF37]" href="/cerez">
        Çerez
      </a>
      <a className="hover:text-[#D4AF37]" href="/kullanim-kosullari">
        Kullanım koşulları
      </a>
    </nav>
  );
}
