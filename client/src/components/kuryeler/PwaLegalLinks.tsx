import { contactEmail, contactPhoneDisplay, contactPhoneTel, whatsappHref } from "@/lib/contact";
import { BUSINESS } from "@shared/kuryeler";

const linkClass = "inline-flex min-h-11 min-w-11 items-center px-2 hover:text-[#D4AF37]";

export function PwaLegalLinks() {
  const phone = contactPhoneDisplay();
  const email = BUSINESS.email === "?" ? "?" : contactEmail();
  return (
    <nav aria-label="İletişim ve yasal" className="flex flex-wrap gap-2 text-sm font-semibold text-[#8a7c52]">
      <a className={linkClass} href={contactPhoneTel()}>
        {phone}
      </a>
      <a className={linkClass} href={whatsappHref()} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      {email === "?" ? (
        <span className="inline-flex min-h-11 items-center px-2">E-posta: ?</span>
      ) : (
        <a className={linkClass} href={`mailto:${email}`}>
          {email}
        </a>
      )}
      <a className={linkClass} href="/sss">
        SSS
      </a>
      <a className={linkClass} href="/kvkk">
        KVKK
      </a>
      <a className={linkClass} href="/cerez">
        Çerez
      </a>
      <a className={linkClass} href="/kullanim-kosullari">
        Kullanım koşulları
      </a>
    </nav>
  );
}
